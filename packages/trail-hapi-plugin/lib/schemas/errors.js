'use strict'

const Joi = require('@hapi/joi')

const errorsMessages = {
  'json.format': 'The body payload is not a valid JSON.',
  'json.contentType': 'Only JSON payloads are accepted. Please set the "Content-Type" header to start with "application/json".',
  'any.required': 'must be present and non empty',
  'any.empty': 'must a non empty string',
  'object.unknown': 'is not a valid attribute',
  'object.base': 'must be a object',
  'string.base': 'must be a string',
  'string.isoDate': 'must be a valid UTC timestamp in the format YYYY-MM-DDTHH:MM:SS.sss (example: 2018-07-06T12:34:56.123)',
  'custom.stringOrObject': 'must be either a non empty string or a object'
}

module.exports = {
  errorsMessages,
  errorsSchemas: {
    400: Joi.object()
      .meta({ className: 'errors/400' })
      .description('Error returned when the input payload is not a valid JSON.')
      .keys({
        statusCode: Joi.number().valid(400).example(400).required(),
        error: Joi.string().valid('Bad Request').example('Bad Request').required(),
        message: Joi.string()
          .valid(errorsMessages['json.contentType'], errorsMessages['json.format'], 'Invalid request payload JSON format')
          .example(errorsMessages['json.format'])
          .required()
      })
      .unknown(false),
    404: Joi.object()
      .meta({ className: 'errors/404' })
      .description('Error returned when a requested resource could not be found.')
      .keys({
        statusCode: Joi.number().valid(404).example(404).required(),
        error: Joi.string().valid('Not Found').example('Not Found').required(),
        message: Joi.string().example('Not Found').required()
      })
      .unknown(false),
    409: Joi.object()
      .meta({ className: 'errors/409' })
      .description('Error returned when a requested resource already exists.')
      .keys({
        statusCode: Joi.number().valid(409).example(409).required(),
        error: Joi.string().valid('Conflict').example('Conflict').required(),
        message: Joi.string().example('Conflict.').required()
      })
      .unknown(false),
    422: Joi.object()
      .meta({ className: 'errors/422' })
      .description('Error returned when the input payload is not a valid trail.')
      .keys({
        statusCode: Joi.number().valid(422).example(422).required(),
        error: Joi.string().valid('Unprocessable Entity').example('Unprocessable Entity').required(),
        message: Joi.string().valid('Invalid input data.').example('Invalid input data.').required()
      })
      .unknown(false),
    500: Joi.object()
      .meta({ className: 'errors/500' })
      .description('Error returned when a unexpected error was thrown by the server.')
      .keys({
        statusCode: Joi.number().valid(500).example(500).required(),
        error: Joi.string().valid('Internal Server Error').example('Internal Server Error').required(),
        message: Joi.string().required(),
        stack: Joi.array().items(Joi.string())
      })
      .unknown(false)
  }
}
