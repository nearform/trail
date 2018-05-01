'use strict'

const Joi = require('joi')

const errorsMessages = {
  'json.format': 'The body payload is not a valid JSON.',
  'json.contentType': 'Only JSON payloads are accepted. Please set the "Content-Type" header to start with "application/json".',
  'any.required': 'must be present and non empty',
  'any.empty': 'must a non empty string',
  'object.allowUnknown': 'is not a valid attribute',
  'object.base': 'must be a object',
  'string.base': 'must be a string',
  'string.isoDate': 'must be a valid UTC timestamp in the format YYYY-MM-DDTHH:MM:SS.sss (example: 2018-07-06T12:34:56.123)',
  'custom.stringOrObject': 'must be either a non empty string or a object'
}

module.exports = {
  errorsMessages,
  errorsSchemas: {
    400: Joi.object()
      .meta({id: 'errors/400'})
      .description('Error returned when the input payload is not a valid JSON.')
      .keys({
        statusCode: Joi.number().valid(400).example(400),
        error: Joi.string().valid('Bad Request').example('Bad Request'),
        message: Joi.string()
          .valid(errorsMessages['json.contentType'], errorsMessages['json.format'], 'Invalid request payload JSON format')
          .example(errorsMessages['json.format'])
      })
      .requiredKeys('statusCode', 'error', 'message')
      .unknown(false),
    404: Joi.object()
      .meta({id: 'errors/404'})
      .description('Error returned when a requested resource could not be found.')
      .keys({
        statusCode: Joi.number().valid(404).example(404),
        error: Joi.string().valid('Not Found').example('Not Found'),
        message: Joi.string().example('Not Found')
      })
      .requiredKeys('statusCode', 'error', 'message')
      .unknown(false),
    409: Joi.object()
      .meta({id: 'errors/404'})
      .description('Error returned when a requested resource already exists.')
      .keys({
        statusCode: Joi.number().valid(409).example(409),
        error: Joi.string().valid('Conflict').example('Conflict'),
        message: Joi.string().example('Conflict.')
      })
      .requiredKeys('statusCode', 'error', 'message')
      .unknown(false),
    422: Joi.object()
      .meta({id: 'errors/422'})
      .description('Error returned when the input payload is not a valid trail.')
      .keys({
        statusCode: Joi.number().valid(422).example(422),
        error: Joi.string().valid('Unprocessable Entity').example('Unprocessable Entity'),
        message: Joi.string().valid('Invalid input data.').example('Invalid input data.')
      })
      .requiredKeys('statusCode', 'error', 'message')
      .unknown(false),
    500: Joi.object()
      .meta({id: 'errors/500'})
      .description('Error returned when a unexpected error was thrown by the server.')
      .keys({
        statusCode: Joi.number().valid(500).example(500),
        error: Joi.string().valid('Internal Server Error').example('Internal Server Error'),
        message: Joi.string(),
        stack: Joi.array().items(Joi.string())
      })
      .requiredKeys('statusCode', 'error', 'message')
      .unknown(false)
  }
}
