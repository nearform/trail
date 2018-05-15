'use strict'

const {TrailsManager} = require('@nearform/trail-core')
const {get} = require('lodash')

const {errorsMessages} = require('./schemas/errors')

const environment = get(process, 'env.NODE_ENV', 'development')

const formatReasons = function (error) {
  const reasons = {}

  // For each erroor
  for (const reason of get(error, 'data.details', [])) {
    // Gather informations and try to assign a message
    const attribute = reason.path.join('.')
    let message = errorsMessages[reason.type]

    // We found a message, add to the output
    if (message) reasons[attribute] = message
  }

  return reasons
}

const formatStack = function (error) {
  const stack = get(error, 'stack', '').split('\n').map(s => s.trim().replace(/^at /, ''))
  stack.shift()
  return stack
}

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
