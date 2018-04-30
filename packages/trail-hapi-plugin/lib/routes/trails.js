'use strict'

const { notFound } = require('boom')
const Joi = require('joi')

const {trailSchema, errorsSchemas} = require('../schemas')
const {failAction, validationOptions} = require('../validation')

module.exports = {
  name: 'trails',
  register: (server, options) => {
    server.route({
      method: 'GET',
      path: '/trails',
      async handler (request, h) {
        const { from, to, who, what, subject, page, pageSize, sort } = request.query

        const results = await request.trailCore.search({ from, to, who, what, subject, page, pageSize, sort })

        return results.length ? results : h.response().code(204)
      },
      config: {
        description: 'Search audit trails.',
        tags: ['api', 'trails'],
        validate: {
          query: trailSchema.search,
          failAction,
          options: validationOptions
        },
        response: {
          status: {
            200: Joi.array()
              .description('The search results.')
              .items(trailSchema.response),
            204: Joi.empty().description('No trails found.'),
            422: errorsSchemas['422'],
            500: errorsSchemas['500']
          }
        }
      }
    })

    server.route({
      method: 'POST',
      path: '/trails',
      async handler (request, h) {
        const id = await request.trailCore.insert(request.payload)
        const trail = await request.trailCore.get(id)

        return h.response(trail).code(201)
      },
      config: {
        description: 'Create a new audit trail.',
        tags: ['api', 'trails'],
        validate: {
          headers: Joi.object()
            .keys({
              'content-type': Joi.string().valid('application/json')
            })
            .unknown(true),
          payload: trailSchema.request,
          failAction,
          options: validationOptions
        },
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

    server.route({
      method: 'GET',
      path: '/trails/{id}',
      async handler (request) {
        const { id } = request.params
        const trail = await request.trailCore.get(id)

        if (!trail) throw notFound(`Trail with id ${id} not found.`)

        return trail
      },
      config: {
        auth: false,
        description: 'Get a audit trail.',
        tags: ['api', 'trails'],
        validate: {
          params: {
            id: trailSchema.params.id
          }
        },
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

    server.route({
      method: 'PUT',
      path: '/trails/{id}',
      async handler (request, h) {
        const { id } = request.params
        const updated = await request.trailCore.update(id, request.payload)

        if (!updated) throw notFound(`Trail with id ${id} not found.`)

        const trail = await request.trailCore.get(id)
        return h.response(trail).code(202)
      },
      config: {
        auth: false,
        description: 'Update a audit trail.',
        tags: ['api', 'trails'],
        validate: {
          headers: Joi.object()
            .keys({
              'content-type': Joi.string().valid('application/json')
            })
            .unknown(true),
          params: {
            id: trailSchema.params.id
          },
          payload: trailSchema.request
        },
        response: {
          status: {
            202: trailSchema.response.description('The updated audit trail.'),
            400: errorsSchemas['400'],
            404: errorsSchemas['404'],
            422: errorsSchemas['422'],
            500: errorsSchemas['500']
          }
        }
      }
    })

    server.route({
      method: 'DELETE',
      path: '/trails/{id}',
      async handler (request, h) {
        const { id } = request.params
        const deleted = await request.trailCore.delete(id)

        if (!deleted) throw notFound(`Trail with id ${id} not found.`)

        return h.response().code(204)
      },
      config: {
        auth: false,
        description: 'Delete a audit trail.',
        tags: ['api', 'trails'],
        validate: {
          params: {
            id: trailSchema.params.id
          }
        },
        response: {
          status: {
            204: Joi.empty().description('The trail has been deleted successfully.'),
            400: errorsSchemas['400'],
            404: errorsSchemas['404'],
            500: errorsSchemas['500']
          }
        }
      }
    })
  }
}
