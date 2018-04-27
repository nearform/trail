'use strict'

const Joi = require('joi')
const {get} = require('lodash')

const namedObject = function (name) {
  return Joi.object()
    .description(name)
    .keys({
      id: Joi.string()
        .description(`${name} id`)
        .example(name)
    })
    .requiredKeys('id')
    .unknown(true)
}

const stringOrObject = function (name) {
  return Joi.alternatives(
    namedObject(name),
    Joi.string()
      .description(`${name} id`)
      .example(name)
      .required()
      .error(errors => {
        const value = get(errors, '0.context.value')

        // The value is object, ignore all the errors here
        if (typeof value === 'object' && !Array.isArray(value)) return {}
        // Overwrite message for invalid type
        return {type: 'custom.stringOrObject'}
      })
  ).example(name)
}

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

const trailSchema = {
  params: {
    id: Joi.number()
      .description('Trail id')
      .meta({id: 'models/trail.params.id'})
      .required()
      .min(0)
      .example(12345)
  },
  request: Joi.object()
    .description('A audit trail')
    .meta({id: 'models/trail.request'})
    .keys({
      when: Joi.string()
        .description('Trail timestamp in ISO 8601 format')
        .example('2018-01-02T03:04:05.123Z')
        .isoDate(),
      who: stringOrObject('Trail actor'),
      what: stringOrObject('Trail subject'),
      subject: stringOrObject('Trail target'),
      where: Joi.object()
        .description('Trail where'),
      why: Joi.object()
        .description('Trail reason'),
      meta: Joi.object()
        .description('Trail meta')
    })
    .requiredKeys('when', 'who', 'what', 'subject')
    .unknown(false),
  response: Joi.object()
    .description('A audit trail')
    .meta({id: 'models/trail.response'})
    .keys({
      id: Joi.number().example(12345),
      when: Joi.any()
        .description('Trail UTC timestamp in ISO 8601 format')
        .tags('datetime')
        .example('2018-01-02T03:04:05.123Z'),
      who: namedObject('Trail actor'),
      what: namedObject('Trail subject'),
      subject: namedObject('Trail target'),
      where: Joi.object()
        .description('Trail where'),
      why: Joi.object()
        .description('Trail reason'),
      meta: Joi.object()
        .description('Trail meta')
    })
    .requiredKeys('when', 'who', 'what', 'subject')
    .unknown(false)
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
  },
  trailSchema
}
