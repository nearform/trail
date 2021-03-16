'use strict'

const { notFound } = require('@hapi/boom')
const S = require('fluent-schema')

const { errorsSchemas } = require('../schemas/errors')
const { spec, trailSchema } = require('../schemas/trails')
const { addApiRoute, generateSpec } = require('../api')

module.exports = async function (fastify, options) {
  for (const path of ['/trails/openapi.json', '/trails/swagger.json']) {
    fastify.route({
      method: 'GET',
      path,
      handler (request, reply) {
        const { address, port } = fastify.server.address()
        const doc = {
          ...spec,
          servers: [
            {
              url: `http://${[address, port].join(':')}/`,
              description: 'Current API server'
            }

          ]
        }
        return reply.send(doc)
      }
    })
  }

  addApiRoute(fastify, 'trails', {
    method: 'GET',
    path: '/trails',
    async handler (request, reply) {
      const { from, to, who, what, subject, page, pageSize, sort } = request.query
      const results = await reply.trailCore.search({ from, to, who, what, subject, page, pageSize, sort })
      return results
    },
    schema: {
      query: trailSchema.search,
      response: {
        200: S.object()
          .prop('count', S.number()
            .description('The search result count')
          )
          .prop('data', S.array()
            .description('The search results.')
            .items(trailSchema.response)
          ),
        422: errorsSchemas['422'],
        500: errorsSchemas['500']
      }
    },
    config: {
      description: 'Search audit trails.',
      tags: ['api', 'trails']
    }
  })

  addApiRoute(fastify, 'trails', {
    method: 'GET',
    path: '/trails/enumerate',
    async handler (request, reply) {
      const { from, to, type, page, pageSize, desc } = request.query
      const results = await reply.trailCore.enumerate({ from, to, type, page, pageSize, desc })
      return results
    },
    schema: {
      query: trailSchema.enumerate,
      response: {
        200: S.array()
          .description('The enumeration results.')
          .items(S.string().description('A trail who, what or subject id')),
        422: errorsSchemas['422'],
        500: errorsSchemas['500']
      }
    },
    config: {
      description: 'Enumerate audit trails ids.',
      tags: ['api', 'trails']
    }
  })

  addApiRoute(fastify, 'trails', {
    method: 'POST',
    path: '/trails',
    async handler (request, reply) {
      const id = await reply.trailCore.insert(request.body)
      const trail = await reply.trailCore.get(id)
      reply.code(201)
      return trail
    },
    schema: {
      headers: S.object()
        .additionalProperties(true)
        .prop('content-type', S.string().const('application/json')),
      body: trailSchema.request,
      response: {
        201: trailSchema.response.description('The newly created audit trail.'),
        400: errorsSchemas['400'],
        422: errorsSchemas['422'],
        500: errorsSchemas['500']
      }
    },
    config: {
      description: 'Create a new audit trail.',
      tags: ['api', 'trails']
    }
  })

  addApiRoute(fastify, 'trails', {
    method: 'GET',
    path: '/trails/:id',
    async handler (request, reply) {
      const { id } = request.params
      const trail = await reply.trailCore.get(id)

      if (!trail) throw notFound(`Trail with id ${id} not found.`)

      return trail
    },
    schema: {
      params: trailSchema.params,
      response: {
        200: trailSchema.response.description('The requested audit trail.'),
        400: errorsSchemas['400'],
        404: errorsSchemas['404'],
        500: errorsSchemas['500']
      }
    },
    config: {
      auth: false,
      description: 'Get a audit trail.',
      tags: ['api', 'trails']
    }
  })

  addApiRoute(fastify, 'trails', {
    method: 'PUT',
    path: '/trails/:id',
    async handler (request, reply) {
      const { id } = request.params
      const updated = await reply.trailCore.update(id, request.body)

      if (!updated) throw notFound(`Trail with id ${id} not found.`)

      const trail = await reply.trailCore.get(id)
      reply.code(202)
      return trail
    },
    schema: {
      headers: S.object()
        .prop('content-type', S.string().const('application/json'))
        .additionalProperties(true),
      params: trailSchema.params,
      body: trailSchema.request,
      response: {
        202: trailSchema.response.description('The updated audit trail.'),
        400: errorsSchemas['400'],
        404: errorsSchemas['404'],
        422: errorsSchemas['422'],
        500: errorsSchemas['500']
      }
    },
    config: {
      auth: false,
      description: 'Update a audit trail.',
      tags: ['api', 'trails']
    }
  })

  addApiRoute(fastify, 'trails', {
    method: 'DELETE',
    path: '/trails/:id',
    async handler (request, reply) {
      const { id } = request.params
      const deleted = await reply.trailCore.delete(id)

      if (!deleted) throw notFound(`Trail with id ${id} not found.`)

      reply.code(204).send()
    },
    schema: {
      params: trailSchema.params,
      response: {
        204: S.object().maxProperties(0).description('The trail has been deleted successfully.'),
        400: errorsSchemas['400'],
        404: errorsSchemas['404'],
        500: errorsSchemas['500']
      }
    },
    config: {
      auth: false,
      description: 'Delete a audit trail.',
      tags: ['api', 'trails']
    }
  })

  // Add tagged routes to the swagger.json
  generateSpec(spec, 'trails')
}
