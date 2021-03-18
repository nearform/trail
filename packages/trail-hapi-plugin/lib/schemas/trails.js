'use strict'

const Joi = require('joi')
const j2s = require('joi-to-swagger')

const { errorsSchemas } = require('./errors')

const namedObject = function (name) {
  return Joi.object()
    .description(name)
    .keys({
      id: Joi.string()
        .description(`${name} id`)
        .example(name)
        .required()
    })
    .unknown(true)
}

const stringOrObject = function (name) {
  return Joi.alternatives().try(
    namedObject(name),
    Joi.string()
      .description(`${name} id`)
      .example(name)
      .error(() => {
        const type = 'custom.stringOrObject'
        const err = new Error(type)
        err.type = type
        return err
      })
  )
    .required()
    .example(name)
}

const dateTime = Joi.string()
  .description('Trail timestamp in ISO 8601 format')
  .example('2018-01-02T03:04:05.123Z')
  .isoDate()

const responseObject = Joi.object()
  .description('A audit trail')
  .meta({ className: 'trail/response' })
  .keys({
    id: Joi.number()
      .description('Trail id')
      .example(12345),
    when: Joi.any()
      .description('Trail UTC timestamp in ISO 8601 format')
      .tag('datetime')
      .example('2018-01-02T03:04:05.123Z')
      .required(),
    who: namedObject('Trail actor').required(),
    what: namedObject('Trail subject').required(),
    subject: namedObject('Trail target').required(),
    where: Joi.object()
      .description('Trail where'),
    why: Joi.object()
      .description('Trail reason'),
    meta: Joi.object()
      .description('Trail meta')
  })
  .unknown(false)

const trailSchema = {
  params: Joi.object()
    .meta({ className: 'trail/params' })
    .keys({
      id: Joi.number()
        .description('Trail id')
        .meta({ id: 'models/trail.params.id' })
        .required()
        .min(0)
        .example(12345)
    }),
  search: Joi.object()
    .description('An audit search')
    .keys({
      from: dateTime
        .description('The minimum timestamp (inclusive)')
        .required(),
      to: dateTime
        .description('The maximum timestamp (inclusive)')
        .required(),
      who: Joi.string()
        .description('A portion of the trail actor id')
        .example('act'),
      what: Joi.string()
        .description('A portion of the trail subject id')
        .example('sub'),
      subject: Joi.string()
        .description('A portion of the trail target id')
        .example('tar'),
      page: Joi.number()
        .description('The page of results to return (first page is 1)')
        .min(0)
        .example(5),
      pageSize: Joi.number()
        .description('The number of results per page (default is 25)')
        .min(1)
        .example(25),
      sort: Joi.string()
        .description('The field to use for sorting results. Default order is ascending, which can be reversed by prepending a dash. Default is "-when"')
        .valid('when', 'id', 'who', 'what', 'subject', '-when', '-id', '-who', '-what', '-subject')
        .example('-when')
    })
    .unknown(false),
  enumerate: Joi.object()
    .description('An audit enumeration')
    .keys({
      from: dateTime
        .description('The minimum timestamp (inclusive)')
        .required(),
      to: dateTime
        .description('The maximum timestamp (inclusive)')
        .required(),
      type: Joi.string()
        .description('The type of id to search')
        .required()
        .valid('who', 'what', 'subject')
        .example('who'),
      page: Joi.number()
        .description('The page of results to return (first page is 1)')
        .min(0)
        .example(5),
      pageSize: Joi.number()
        .description('The number of results per page (default is 25)')
        .min(1)
        .example(25),
      desc: Joi.boolean()
        .description('If to sort alphabetically by descending order')
        .example(true)
    })
    .unknown(false),
  request: Joi.object()
    .description('A audit trail')
    .meta({ className: 'trail/request' })
    .keys({
      when: dateTime,
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
    .unknown(false),
  response: responseObject,
  searchResponse: Joi.object()
    .keys({
      count: Joi.number()
        .description('The total count of search results.'),
      data: Joi.array()
        .description('The search results.')
        .items(responseObject)
    })
}

const components = [
  trailSchema.params,
  trailSchema.request,
  trailSchema.response,
  errorsSchemas[400],
  errorsSchemas[404],
  errorsSchemas[422],
  errorsSchemas[500]
].reduce((components, joi, idx) => {
  const result = j2s(joi, components)
  return { schemas: Object.assign(components.schemas, result.components.schemas) }
}, { schemas: {} })

const spec = {
  openapi: '3.0.1',
  info: {
    title: 'Trail API Documentation',
    description: 'This page documents Trail\'s API endpoints, along with their various inputs and outputs. For more information about Trail please see the <a href="https://nearform.github.io/trail">Documentation Site.</a>',
    contact: {
      name: 'nearForm',
      url: 'https://github.com/nearform/trail',
      email: 'ireland@nearform.com'
    },
    license: {
      name: 'MIT',
      url: 'https://choosealicense.com/licenses/mit/'
    },
    version: require('../../package').version
  },
  tags: [
    {
      name: 'trails',
      description: 'Manage audit trails'
    },
    {
      name: 'monitoring',
      description: 'Endpoints for monitoring and uptime'
    }
  ],
  components,
  paths: {}
}

module.exports = {
  trailSchema,
  components,
  spec
}
