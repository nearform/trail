'use strict'

const { notFound } = require('@hapi/boom')
const Joi = require('joi')

const { errorsSchemas } = require('../schemas/errors')
const { spec, components, trailSchema } = require('../schemas/trails')
const { failAction, validationOptions } = require('../validation')
const { addApiRoute, generateSpec } = require('../api')

module.exports = {
  name: 'trails',
  register: (server, options) => {
    for (const path of ['/trails/openapi.json', '/trails/swagger.json']) {
      server.route({
        method: 'GET',
        path,
        handler (request, h) {
          const { info: { host, port } } = server
          const doc = {
            ...spec,
            servers: [
              {
                url: `http://${[host, port].join(':')}/`,
                description: 'Current API server'
              }
            ]
          }
          return doc
        }
      })
    }

    addApiRoute(server, 'trails', {
      method: 'GET',
      path: '/trails',
      async handler (request, h) {
        const { from, to, who, what, subject, page, pageSize, sort } = request.query

        return request.trailCore.search({ from, to, who, what, subject, page, pageSize, sort })
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
            200: Joi.object()
              .keys({
                count: Joi.number()
                  .description('Count of trail records matching filters'),
                data: Joi.array()
                .description('The search results.')
                .items(trailSchema.response)
              }),
            422: errorsSchemas['422'],
            500: errorsSchemas['500']
          }
        }
      }
    })

    addApiRoute(server, 'trails', {
      method: 'GET',
      path: '/trails/enumerate',
      async handler (request, h) {
        const { from, to, type, page, pageSize, desc } = request.query

        return request.trailCore.enumerate({ from, to, type, page, pageSize, desc })
      },
      config: {
        description: 'Enumerate audit trails ids.',
        tags: ['api', 'trails'],
        validate: {
          query: trailSchema.enumerate,
          failAction,
          options: validationOptions
        },
        response: {
          status: {
            200: Joi.array()
              .description('The enumeration results.')
              .items(Joi.string().description('A trail who, what or subject id')),
            422: errorsSchemas['422'],
            500: errorsSchemas['500']
          }
        }
      }
    })

    addApiRoute(server, 'trails', {
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

    addApiRoute(server, 'trails', {
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
          params: trailSchema.params
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

    addApiRoute(server, 'trails', {
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
          params: trailSchema.params,
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

    addApiRoute(server, 'trails', {
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
          params: trailSchema.params
        },
        response: {
          status: {
            204: Joi.any().empty().description('The trail has been deleted successfully.'),
            400: errorsSchemas['400'],
            404: errorsSchemas['404'],
            500: errorsSchemas['500']
          }
        }
      }
    })

    // Add tagged routes to the swagger.json
    server.ext('onPostStart', server => {
      generateSpec(spec, components, 'trails')
    })
  }
}
