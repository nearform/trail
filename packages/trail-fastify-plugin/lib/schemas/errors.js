const S = require('fluent-schema')

const errorsMessages = {
  'json.format': 'The body payload is not a valid JSON.',
  'json.contentType': 'Only JSON payloads are accepted. Please set the "Content-Type" header to start with "application/json".',
  'any.required': 'must be present and non empty',
  'any.empty': 'must a non empty string',
  'object.unknown': 'is not a valid attribute',
  'object.base': 'should be object',
  'string.base': 'must be a string',
  'string.isoDate': 'should match format "date-time"',
    'custom.stringOrObject': 'must be either a non empty string or a object',
    'custom.isoDate': 'must be a valid UTC timestamp in the format YYYY-MM-DDTHH:MM:SS.sss (example: 2018-07-06T12:34:56.123)'
}

module.exports = {
  errorsMessages,
  errorsSchemas: {
    400: S.object()
      .raw({ meta: { id: 'errors/400' } })
      .description('Error returned when the input payload is not a valid JSON.')
      .prop('statusCode', S.number().const(400).examples([400]))
      .prop('error', S.string().const('Bad Request').examples(['Bad Request']))
      .prop('message', S.string()
        .enum([errorsMessages['json.contentType'], errorsMessages['json.format'], 'Invalid request payload JSON format'])
        .examples([errorsMessages['json.format']]))
      .required(['statusCode', 'error', 'message'])
      .additionalProperties(false),
    404: S.object()
      .raw({ meta: { id: 'errors/404' } })
      .description('Error returned when a requested resource could not be found.')
      .prop('statusCode', S.number().const(404).examples([404]))
      .prop('error', S.string().const('Not Found').examples(['Not Found']))
      .prop('message', S.string().examples(['Not Found']))
      .required(['statusCode', 'error', 'message'])
      .additionalProperties(false),
    409: S.object()
      .raw({ meta: { id: 'errors/404' } })
      .description('Error returned when a requested resource already exists.')
      .prop('statusCode', S.number().const(409).examples([409]))
      .prop('error', S.string().const('Conflict').examples(['Conflict']))
      .prop('message', S.string().examples(['Conflict.']))
      .required(['statusCode', 'error', 'message'])
      .additionalProperties(false),
    422: S.object()
      .raw({ meta: { id: 'errors/422' } })
      .description('Error returned when the input payload is not a valid trail.')
      .prop('statusCode', S.number().const(422).examples([422]))
      .prop('error', S.string().const('Unprocessable Entity').examples(['Unprocessable Entity']))
      .prop('message', S.string().const('Invalid input data.').examples(['Invalid input data.']))
      .prop('reasons', S.object().additionalProperties(true))
      .required(['statusCode', 'error', 'message'])
      .additionalProperties(false),
    500: S.object()
      .raw({ meta: { id: 'errors/500' } })
      .description('Error returned when a unexpected error was thrown by the server.')
      .prop('statusCode', S.number().const(500).examples([500]))
      .prop('error', S.string().const('Internal Server Error').examples(['Internal Server Error']))
      .prop('message', S.string())
      .prop('stack', S.array().items(S.string()))
      .required(['statusCode', 'error', 'message'])
      .additionalProperties(false)
  }
}
