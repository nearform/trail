const config = require('config')
const S = require('fluent-schema')

const { errorsSchemas } = require('./errors')
const host = config.get('fastify.host')
const port = config.get('fastify.port')

const schemaToJSON = s => JSON.stringify(s.valueOf)

const namedObject = function (name) {
  return S.object()
    .description(name)
    .prop('id', S.string()
      .description(`${name} id`)
      .examples([name])
    )
    .required(['id'])
    .additionalProperties(true)
}

// Consider using .definition for this instead? (see fluent-schema readme)
const stringOrObject = function (name) {
  // return Joi.alternatives().try(
    // TODO Possibly S.mixed should be used here instead
  return S.oneOf([
    namedObject(name),
    S.string()
      .description(`${name} id`)
      .examples([name])
    /* TODO custom error
      .error(() => {
        const type = 'custom.stringOrObject'
        const err = new Error(type)
        err.type = type
        return err
      })
      */
  ])
    // TODO Will this required work as expected?
    .required()
    .examples([name])
}

const dateTime = S.string()
  .description('Trail timestamp in ISO 8601 format')
  .format('date-time') // https://json-schema.org/understanding-json-schema/reference/string.html
  .examples(['2018-01-02T03:04:05.123Z'])

const trailSchema = {
  params: S.object()
    .prop('id', S.number()
      .description('Trail id')
      /* TODO need to confirm meta -> raw is correct
       * (raw seems to be a way to add properties directly to the underlying schema description object)
      .meta({ id: 'models/trail.params.id' })
      */
      .raw({ id: 'models/trail.params.id' })
      .minimum(0)
      .examples([12345]))
    .required(['id']),
  search: S.object()
    .description('An audit search')
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
    /* TODO confirm valid -> enum is correct
        .valid('when', 'id', 'who', 'what', 'subject', '-when', '-id', '-who', '-what', '-subject')
        */
      .enum(['when', 'id', 'who', 'what', 'subject', '-when', '-id', '-who', '-what', '-subject'])
      .examples(['-when']))
    .required(['from', 'to'])
    .additionalProperties(false),
  enumerate: S.object()
    .description('An audit enumeration')
    .prop('from', dateTime.description('The minimum timestamp (inclusive)'))
    .prop('to', dateTime.description('The maximum timestamp (inclusive)'))
    .prop('type', S.string()
      .description('The type of id to search')
    /* TODO confirm valid -> enum is correct
        .valid('who', 'what', 'subject')
        */
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
    .required(['from', 'to', 'type'])
    .additionalProperties(false),
  request: S.object()
    .description('A audit trail')
    /* TODO need to confirm meta -> raw is correct
    .meta({ id: 'models/trail.request' })
    */
    .raw({ id: 'models/trail.request' })
    .prop('when', dateTime)
    .prop('who', stringOrObject('Trail actor'))
    .prop('what', stringOrObject('Trail subject'))
    .prop('subject', stringOrObject('Trail target'))
    .prop('where', S.object().description('Trail where'))
    .prop('why', S.object().description('Trail reason'))
    .prop('meta', S.object().description('Trail meta'))
    .additionalProperties(false),
  response: S.object()
    .description('A audit trail')
    /* TODO need to confirm meta -> raw is correct
    .meta({ id: 'models/trail.response' })
    */
    .raw({ id: 'models/trail.response' })
    .prop('id', S.number()
      .description('Trail id')
      .examples([12345]))
    /* TODO Note Joi.any -> S.string - need to confirm
    .prop('when', Joi.any()
    */
    .prop('when', S.string()
      .description('Trail UTC timestamp in ISO 8601 format')
      .tag('datetime')
      .examples(['2018-01-02T03:04:05.123Z']))
    .prop('who', namedObject('Trail actor'))
    .prop('what', namedObject('Trail subject'))
    .prop('subject', namedObject('Trail target'))
    .prop('where', S.object().description('Trail where'))
    .prop('why', S.object().description('Trail reason'))
    .prop('meta', S.object().description('Trail meta'))
    .required(['when', 'who', 'what', 'subject'])
    .additionalProperties(false)
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
