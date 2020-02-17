const Boom = require('boom')

const { errorsMessages } = require('./schemas/errors')

module.exports = {
  validationOptions: {
    abortEarly: false
  },
  failAction (request, h, error) {
    if (request.mime && !request.mime.startsWith('application/json')) { // Validate the Content-Type
      error = Boom.badRequest(errorsMessages['json.contentType'])
    } else { // In case of other validation errors, use the more appropriate 422 HTTP code rather than the default 400
      error = Boom.badData('Invalid input data.', error)
    }

    error.isTrail = true

    throw error
  }
}
