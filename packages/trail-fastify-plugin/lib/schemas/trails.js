const config = require('config')
const S = require('fluent-schema')

const { errorsSchemas } = require('./errors')
const host = config.get('fastify.host')
const port = config.get('fastify.port')

const schemaToJSON = s => JSON.stringify(s.valueOf())

const namedObject = function (name) {
  return S.object()
    .description(name)
    .additionalProperties(true)
    .prop('id', S.string()
      .description(`${name} id`)
      .examples([name])
    )
    .required(['id'])
}

const stringOrObject = function (name) {
  return S.anyOf([
    namedObject(name),
    S.string()
      .description(`${name} id`)
      .examples([name])
  ])
    .required()
    .raw({ meta: { errorType: 'custom.stringOrObject' } })
    .examples([name])
}

const dateTime = S.string()
  .description('Trail timestamp in ISO 8601 format')
  .format('date-time')
    .raw({ meta: { errorType: 'custom.isoDate' } })
  .examples(['2018-01-02T03:04:05.123Z'])

const trailSchema = {
  params: S.object()
    .prop('id', S.string()
      .description('Trail id')
      .raw({ meta: { id: 'models/trail.params.id' } })
      .pattern(/^\d+$/)
      .examples(['12345']))
    .required(['id']),
  search: S.object()
    .description('An audit search')
    .additionalProperties(false)
    .prop('from', dateTime
      .description('The minimum timestamp (inclusive)'))
    .prop('to', dateTime
      .description('The maximum timestamp (inclusive)'))
    .prop('who', S.string()
      .description('A portion of the trail actor id')
      .examples(['act']))
    .prop('what', S.string()
      .description('A portion of the trail subject id')
      .examples(['sub']))
    .prop('subject', S.string()
      .description('A portion of the trail target id')
      .examples(['tar']))
    .prop('page', S.number()
      .description('The page of results to return (first page is 1)')
      .minimum(0)
      .examples([5]))
    .prop('pageSize', S.number()
      .description('The number of results per page (default is 25)')
      .minimum(1)
      .examples([25]))
    .prop('sort', S.string()
      .description('The field to use for sorting results. Default order is ascending, which can be reversed by prepending a dash. Default is "-when"')
      .enum(['when', 'id', 'who', 'what', 'subject', '-when', '-id', '-who', '-what', '-subject'])
      .examples(['-when']))
    .required(['from', 'to']),
  enumerate: S.object()
    .description('An audit enumeration')
    .additionalProperties(false)
    .prop('from', dateTime.description('The minimum timestamp (inclusive)'))
    .prop('to', dateTime.description('The maximum timestamp (inclusive)'))
    .prop('type', S.string()
      .description('The type of id to search')
      .enum(['who', 'what', 'subject'])
      .examples(['who']))
    .prop('page', S.number()
      .description('The page of results to return (first page is 1)')
      .minimum(0)
      .examples([5]))
    .prop('pageSize', S.number()
      .description('The number of results per page (default is 25)')
      .minimum(1)
      .examples([25]))
    .prop('desc', S.boolean()
      .description('If to sort alphabetically by descending order')
      .examples([true]))
    .required(['from', 'to', 'type']),
  request: S.object()
    .description('A audit trail')
    .additionalProperties(false)
    .raw({ meta: { id: 'models/trail.request' } })
    .prop('when',S.string()
        .description('Trail timestamp in ISO 8601 format')
        .format('date-time')
        .examples(['2018-01-02T03:04:05.123Z']))
    .prop('who', stringOrObject('Trail actor'))
    .prop('what', stringOrObject('Trail subject'))
    .prop('subject', stringOrObject('Trail target'))
    .prop('where', S.object().description('Trail where'))
    .prop('why', S.object().description('Trail reason'))
    .prop('meta', S.object().description('Trail meta')),
  response: S.object()
    .description('A audit trail')
    .additionalProperties(false)
    .raw({ meta: { id: 'models/trail.response' } })
    .prop('id', S.number()
      .description('Trail id')
      .examples([12345]))
    .prop('when', dateTime)
    .prop('who', namedObject('Trail actor'))
    .prop('what', namedObject('Trail subject'))
    .prop('subject', namedObject('Trail target'))
    .prop('where', S.object().description('Trail where'))
    .prop('why', S.object().description('Trail reason'))
    .prop('meta', S.object().description('Trail meta'))
    .required(['when', 'who', 'what', 'subject'])
}

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
  servers: [
    {
      url: `http://${[host, port].join(':')}/`,
      description: 'Current API server'
    }
  ],
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
  components: {
    models: {
      'trail.params.id': schemaToJSON(trailSchema.params.id),
      'trail.request': schemaToJSON(trailSchema.request),
      'trail.response': schemaToJSON(trailSchema.response)
    },
    errors: {
      400: schemaToJSON(errorsSchemas['400']),
      404: schemaToJSON(errorsSchemas['404']),
      422: schemaToJSON(errorsSchemas['422']),
      500: schemaToJSON(errorsSchemas['500'])
    }
  },
  paths: {}
}

module.exports = {
  trailSchema,
  spec
}
