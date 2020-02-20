const fp = require('fastify-plugin')
const { TrailsManager } = require('@nearform/trail-core')
const { get } = require('lodash')
const Ajv = require('ajv')

const { errorsMessages } = require('./schemas/errors')

const environment = get(process, 'env.NODE_ENV', 'development')

function getCustomErrorMessage (schema, path, message) {
  // Convert a schema path like '#/properties/who/anyOf' to a ref addressing
  // the custom error type, e.g. 'properties.who.meta.errorType'
  const ref = path
    .substring(path.indexOf('/') + 1, path.lastIndexOf('/'))
    .replace(/\//g, '.')
    .concat('.meta.errorType')
  const errorType = get(schema, ref)
  return errorType ? errorsMessages[errorType] : message
}

function formatReasons (error, schema) {
  const { validation } = error
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
      case 'required':
        if (!schemaPath.includes('anyOf')) {
          reasons[params.missingProperty] = errorsMessages['any.required']
        }
        break
      case 'additionalProperties':
        reasons[params.additionalProperty] = errorsMessages['object.unknown']
        break
      default:
        reasons[name] = getCustomErrorMessage(schema, schemaPath, message)
    }
    return reasons
  }, {})
}

const formatStack = error => get(error, 'stack', '')
  .split('\n')
  .filter((s, i) => i > 0)
  .map(s => s.trim().replace(/^at /, ''))

const validationContextMessages = {
  querystring: 'Invalid input data.',
  body: 'Invalid input data.'
}

function formatValidationErrorResponse (error, context) {
  const { validationContext } = error
  const schema = context.schema[validationContext]
  return {
    statusCode: 422,
    error: 'Unprocessable Entity',
    message: validationContextMessages[validationContext],
    reasons: formatReasons(error, schema)
  }
}

async function trail (server, options) {
  const trailsManager = new TrailsManager(undefined, options.pool)

  server.decorate('trailCore', trailsManager)
  server.decorateReply('trailCore', trailsManager)

  server.addHook('onClose', async (instance, done) => {
    await trailsManager.close()
    done()
  })

  const ajv = new Ajv({ allErrors: true })

  server.schemaCompiler = schema => {
    const spec = typeof schema.valueOf === 'function' ? schema.valueOf() : schema
    return ajv.compile(spec)
  }

  server.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      const response = formatValidationErrorResponse(error, reply.context)
      return reply.code(response.statusCode).send(response)
    }

    const code = error.isBoom ? error.output.statusCode : (error.statusCode || 500)

    if (error.message === 'Unexpected end of JSON input') { // Body was an invalid JSON
      error = {
        statusCode: 400,
        error: 'Bad Request',
        message: errorsMessages['json.format']
      }
    } else if (code === 500) { // Add the stack
      const stack = environment !== 'production' ? formatStack(error) : undefined
      error = {
        statusCode: 500,
        error: 'Internal Server Error',
        message: `[${error.code || error.name}] ${error.message}`,
        stack
      }
    }
    reply.code(code).send(error)
  })

  await server.register(require('./routes/trails'))
}

module.exports = fp(trail, { name: 'trail-fastify-plugin' })
