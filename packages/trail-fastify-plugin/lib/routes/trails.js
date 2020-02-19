const { notFound } = require('boom')
const S = require('fluent-schema')

const { errorsSchemas } = require('../schemas/errors')
const { spec, trailSchema } = require('../schemas/trails')
// const { failAction, validationOptions } = require('../validation')
const { addApiRoute, generateSpec } = require('../api')

module.exports = async function (fastify, options, done) {
  for (const path of ['/trails/openapi.json', '/trails/swagger.json']) {
    fastify.route({
      method: 'GET',
      path,
      handler (request, reply) {
        return reply.send(spec)
      }
    })
  }

  addApiRoute(fastify, 'trails', {
    method: 'GET',
    path: '/trails',
    async handler (request, reply) {
      const { from, to, who, what, subject, page, pageSize, sort } = request.query

      const results = await reply.trailCore.search({ from, to, who, what, subject, page, pageSize, sort })
      reply.send(results)
    },
    schema: {
      query: trailSchema.search,
        /* TODO Need to use https://www.npmjs.com/package/fastify-response-validation for response validation
         * Or see https://www.fastify.io/docs/latest/Validation-and-Serialization/#serialization
      response: S.array()
        .description('The search results.')
        .items(trailSchema.response)
        */
    },
    config: {
      description: 'Search audit trails.',
      tags: ['api', 'trails'],
      /*
      validate: {
        query: trailSchema.search,
        failAction,
        options: validationOptions
      },
      */
      response: {
        status: {
          200: S.array()
            .description('The search results.')
            .items(trailSchema.response),
          422: errorsSchemas['422'],
          500: errorsSchemas['500']
        }
      }
    }
  })

  addApiRoute(fastify, 'trails', {
    method: 'GET',
    path: '/trails/enumerate',
    async handler (request, reply) {
      const { from, to, type, page, pageSize, desc } = request.query

      const results = await reply.trailCore.enumerate({ from, to, type, page, pageSize, desc })
      reply.send(results)
    },
    schema: {
      query: trailSchema.enumerate,
      /*
      response: S.array()
        .description('The enumeration results.')
        .items(S.string().description('A trail who, what or subject id'))
        */
    },
    config: {
      description: 'Enumerate audit trails ids.',
      tags: ['api', 'trails'],
      /*
      validate: {
        query: trailSchema.enumerate,
        failAction,
        options: validationOptions
      },
      */
      response: {
        status: {
          200: S.array()
            .description('The enumeration results.')
            .items(S.string().description('A trail who, what or subject id')),
          422: errorsSchemas['422'],
          500: errorsSchemas['500']
        }
      }
    }
  })

  addApiRoute(fastify, 'trails', {
    method: 'POST',
    path: '/trails',
    async handler (request, reply) {
      const id = await reply.trailCore.insert(request.body)
      const trail = await reply.trailCore.get(id)

      reply.code(201).send(trail)
    },
    schema: {
      headers: S.object()
        .additionalProperties(true)
        .prop('content-type', S.string().const('application/json')),
      body: trailSchema.request,
      /*
      response: trailSchema.response.description('The newly created audit trail.')
      */
    },
    config: {
      description: 'Create a new audit trail.',
      tags: ['api', 'trails'],
      /*
      validate: {
        headers: S.object()
          .prop('content-type', S.string().valid('application/json'))
          .additionalProperties(true),
        payload: trailSchema.request,
        failAction,
        options: validationOptions
      },
      */
      response: {
        status: {
          201: trailSchema.response.description('The newly created audit trail.'),
          400: errorsSchemas['400'],
          422: errorsSchemas['422'],
          500: errorsSchemas['500']
        }
      }
    }
  })

  addApiRoute(fastify, 'trails', {
    method: 'GET',
    path: '/trails/{id}',
    async handler (request, reply) {
      const { id } = request.params
      const trail = await reply.trailCore.get(id)

      if (!trail) throw notFound(`Trail with id ${id} not found.`)

      return reply.send(trail)
    },
    schema: {
      /*
      query: trailSchema.params,
      response: trailSchema.response.description('The requested audit trail.')
      */
    },
    config: {
      auth: false,
      description: 'Get a audit trail.',
      tags: ['api', 'trails'],
      /*
      validate: {
        params: {
          id: trailSchema.params.id
        }
      },
      */
      response: {
        status: {
          200: trailSchema.response.description('The requested audit trail.'),
          400: errorsSchemas['400'],
          404: errorsSchemas['404'],
          500: errorsSchemas['500']
        }
      }
    }
  })

  addApiRoute(fastify, 'trails', {
    method: 'PUT',
    path: '/trails/{id}',
    async handler (request, reply) {
      const { id } = request.params
      const updated = await reply.trailCore.update(id, request.body)

      if (!updated) throw notFound(`Trail with id ${id} not found.`)

      const trail = await reply.trailCore.get(id)
      reply.code(202).send(trail)
    },
    schema: {
      /*
      headers: S.object()
        .prop('content-type', S.string().const('application/json'))
        .additionalProperties(true),
      query: trailSchema.params,
      body: trailSchema.request,
      response: trailSchema.response.description('The updated audit trail.').valueOf()
      */
    },
    config: {
      auth: false,
      description: 'Update a audit trail.',
      tags: ['api', 'trails'],
      /*
      validate: {
        headers: S.object()
          .prop('content-type', S.string().valid('application/json'))
          .additionalProperties(true),
        params: {
          id: trailSchema.params.id
        },
        payload: trailSchema.request
      },
      */
      response: {
        status: {
          /*
          202: trailSchema.response.description('The updated audit trail.'),
          400: errorsSchemas['400'],
          404: errorsSchemas['404'],
          422: errorsSchemas['422'],
          500: errorsSchemas['500']
        */
        }
      }
    }
  })

  addApiRoute(fastify, 'trails', {
    method: 'DELETE',
    path: '/trails/{id}',
    async handler (request, reply) {
      const { id } = request.params
      const deleted = await reply.trailCore.delete(id)

      if (!deleted) throw notFound(`Trail with id ${id} not found.`)

      reply.code(204).send()
    },
    schema: {
      query: trailSchema.params
      // TODO Is following correct for an empty response?
      // response: S.object().description('The trail has been deleted successfully.').null()
    },
    config: {
      auth: false,
      description: 'Delete a audit trail.',
      tags: ['api', 'trails'],
      /*
      validate: {
        params: {
          id: trailSchema.params.id
        }
      },
      */
      response: {
        status: {
          // TODO Is following correct for an empty response?
          // 204: S.object().maxProperties(0).description('The trail has been deleted successfully.'),
          400: errorsSchemas['400'],
          404: errorsSchemas['404'],
          500: errorsSchemas['500']
        }
      }
    }
  })

  // Add tagged routes to the swagger.json
  generateSpec(spec, 'trails')

  done()
}
