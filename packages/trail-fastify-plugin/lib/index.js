const fp = require('fastify-plugin')
const { TrailsManager } = require('@nearform/trail-core')
const { get } = require('lodash')
const Ajv = require('ajv')

const { errorsMessages } = require('./schemas/errors')

const environment = get(process, 'env.NODE_ENV', 'development')

function getCustomErrorMessage (schema, path, message) {
  // Convert a schema path like '#/properties/who/anyOf' to a ref like
  // 'properties.who.meta.errorType' addressing the custom error type
  const ref = path
    .substring(path.indexOf('/') + 1, path.lastIndexOf('/'))
    .replace(/\//g, '.')
    .concat('.meta.errorType')
  const errorType = get(schema, ref)
  return errorType ? errorsMessages[errorType] : message
}

const formatReasons = (error, schema) => {
  const { validation } = error
  console.log('V', validation)
  return validation.reduce((reasons, item) => {
    const {
      dataPath,
      schemaPath,
      keyword,
      message,
      params
    } = item
    const name = dataPath.slice(1)
    switch (keyword) {
      case 'anyOf':
        reasons[name] = getCustomErrorMessage(schema, schemaPath, message)
        break
      case 'required':
        if (!schemaPath.includes('anyOf')) {
          reasons[params.missingProperty] = errorsMessages['any.required']
        }
        break
      case 'additionalProperties':
        reasons[params.additionalProperty] = message
        break
      default:
        reasons[name] = message
    }
    return reasons
  }, {})
}

const formatStack = error => get(error, 'stack', '')
  .filter((s, i) => i > 0)
  .split('\n')
  .map(s => s.trim().replace(/^at /, ''))

const validationContextMessages = {
  querystring: 'Invalid input data.',
  body: 'Invalid input data.'
}

function formatValidationErrorResponse (error, context) {
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
    // console.log('E',error)
    if (error.validation) {
      const response = formatValidationErrorResponse(error, reply.context)
      reply.code(response.statusCode).type('application/json').send(response)
      return
    }

    // Rewrite JSON parse errors.
    if (error.message === 'Unexpected end of JSON input') {
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
