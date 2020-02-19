const fp = require('fastify-plugin')
const { TrailsManager } = require('@nearform/trail-core')
const { get } = require('lodash')
const Ajv = require('ajv')

const { errorsMessages } = require('./schemas/errors')

const environment = get(process, 'env.NODE_ENV', 'development')

function longestCommonPrefix(a, b) {
    let i;
    for( i = 0; i < a.length && i < b.length && a[i] === b[i]; i++);
    return a.substring(0,i)
}

function getSchemaErrorType(schema, path) {
    const { meta } = path
        .slice(2)
        .split('/')
        .slice(0,-1)
        .reduce((node, id) => node ? node[id] : {}, schema)
    return meta ? meta.errorType : null
}

const formatReasons = (error, schema) => {
    const { validation } = error
    console.log('V',validation)

    // TODO: Probably better to look specifically for validation reason keyword 'anyOf' and then
    // look for the custom error code directly on the parent node of the indicated schema path.
    // The 'anyOf' reason should be reported after any nested reasons.

    // Extract reasons and group by field name.
    const reasons = validation.reduce((reasons, item) => {
        const {
            dataPath,
            schemaPath,
            message,
            params: {
                missingProperty,
                additionalProperty 
            }
        } = item
        const name = missingProperty || additionalProperty || dataPath.slice(1)
        if(reasons[name]) {
            const reason = reasons[name]
            reason.schemaPath = longestCommonPrefix(reason.schemaPath, schemaPath)
        }
        else reasons[name] = { message, schemaPath }
        return reasons
    }, {})

    // Try reading custom error codes from schema before returning result.
    return Object.entries(reasons).reduce(( reasons, entry ) => {
        const [ name, { message, schemaPath }] = entry 
        const errorType = getSchemaErrorType(schema, schemaPath)
        reasons[name] = errorType ? errorsMessages[errorType] : message
        return reasons
    }, {})
}

const formatStack = error => get(error, 'stack', '')
  .filter((s, i) => i > 0)
  .split('\n')
  .map(s => s.trim().replace(/^at /, ''))

const validationContextMessages = {
    'querystring': 'Invalid input data.',
    'body': 'Invalid input data.'
}

function formatValidationErrorResponse(error, context) {
    const { message, validationContext } = error
    const schema = context.schema[validationContext]
    return {
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: validationContextMessages[validationContext],
        reasons: formatReasons(error, schema)
    }
}

async function trail (server, options) {
  const whitelistedErrors = [404]
  const trailsManager = new TrailsManager(undefined, options.pool)

  server.decorate('trailCore', trailsManager)
  server.decorateReply('trailCore', trailsManager)

  server.addHook('onClose', async (instance, done) => {
    await trailsManager.close()
    done()
  })

  // TODO: This isn't needed, used only for debug; remove ajv dependency when removing this.
  server.schemaCompiler = schema => {
    const spec = typeof schema.valueOf === 'function' ? schema.valueOf() : schema
    const ajv = new Ajv({ allErrors: true })
    return ajv.compile(spec)
  }

  server.setErrorHandler((error, request, reply) => {
      //console.log('E',error)
    if (error.validation) {
      const response = formatValidationErrorResponse(error, reply.context)
      reply.code(response.statusCode).type('application/json').send(response)
      return
    }

      // Rewrite JSON parse errors.
      if(error.message === 'Unexpected end of JSON input') {
          error = {
              statusCode: 400,
              error: 'Bad Request',
              message: errorsMessages['json.format']
          }
      }

    // TODO review following
    const code = error.isBoom ? error.output.statusCode : error.statusCode

    if (
      !error.isTrail && error.message !== 'Invalid request payload JSON format' &&
            (code < 400 || whitelistedErrors.includes(code))
    ) return // No error or a error we don't want to manage, we're fine

    // Body was an invalid JSON
    if (error.message === 'Invalid request payload JSON format') {
      error.message = errorsMessages['json.format']
      error.reformat()
    } else if (code === 422) { // Validation errors
      error.output.payload.reasons = formatReasons(error)
    } else if (code === 500 && environment !== 'production') { // Add the stack
      error.output.payload.message = `[${error.code || error.name}] ${error.message}`
      error.output.payload.stack = formatStack(error)
    }
    reply.code = code
    reply.send(error)
  })

  await server.register(require('./routes/trails'))
}

module.exports = fp(trail)

/*
exports.plugin = {
  pkg: require('../package'),

  register: async (server, options) => {
    const whitelistedErrors = [404]
    const trailsManager = new TrailsManager(undefined, options.pool)

    server.decorate('server', 'trailCore', trailsManager)
    server.decorate('request', 'trailCore', trailsManager)

    server.ext('onPreResponse', (request, h) => {
      const error = request.response
      const code = error.isBoom ? error.output.statusCode : error.statusCode

      if (
        !error.isTrail && error.message !== 'Invalid request payload JSON format' &&
        (code < 400 || whitelistedErrors.includes(code))
      ) return h.continue // No error or a error we don't want to manage, we're fine

      // Body was an invalid JSON
      if (error.message === 'Invalid request payload JSON format') {
        error.message = errorsMessages['json.format']
        error.reformat()
      } else if (code === 422) { // Validation errors
        error.output.payload.reasons = formatReasons(error)
      } else if (code === 500 && environment !== 'production') { // Add the stack
        error.output.payload.message = `[${error.code || error.name}] ${error.message}`
        error.output.payload.stack = formatStack(error)
      }

      return h.continue
    })

    server.ext('onPostStop', async () => {
      await trailsManager.close()
    })

    await server.register(require('./routes/trails'))
  }
}
*/
