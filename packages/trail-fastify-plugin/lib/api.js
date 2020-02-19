const { get } = require('lodash')

const addReference = function (spec) {
  const value = typeof spec.valueOf === 'function' ? spec.valueOf() : spec
  /* TODO confirm
  const id = get(info, 'metas.0.id')
  */
  const id = get(value, 'meta.id')

  if (id) return { $ref: `#/components/${id}` }
  else if (spec.isFluentSchema) return JSON.stringify(value)
  else return spec
}

const parseResponses = function (route) {
  const responses = {}
  const specObject = get(route, 'config.response.status')

  // Get the pairs and sort by HTTP code (lower first)
  const specPairs = Object.entries(specObject).sort((a, b) => a[0] - b[0])

  // For each response
  for (const [code, response] of specPairs) {
    // Get its value and any reference id
    const value = response.valueOf() // TODO => { description }

    // TODO check value.description here
    if (code === '204') { // No body reply
      responses[code] = { description: value.description }
    } else { // Assign the new response, either with a reference or by converting the object
      responses[code] = {
        description: value.description,
        content: {
          'application/json': {
            schema: addReference(response)
          }
        }
      }
    }
  }

  return responses
}

const parseParameters = function (route) {
  // If there is a already defined format, use it
  const specObject = get(route, 'config.validate.params')

  if (!specObject) return null

  return Object.entries(specObject).map(([name, spec]) => {
    const value = spec.valueOf()

    // TODO check value.description etc. here
    return {
      name,
      in: 'path',
      description: value.description,
      required: get(value, 'flags.presence') === 'required',
      schema: addReference(value)
    }
  })
}

const parseQuerystring = function (route) {
  // If there is a already defined format, use it
  const specObject = get(route, 'config.validate.query')

  if (!specObject) return null

  const spec = specObject.describe().keys
  return Object.entries(spec).map(([name, value]) => {
    return {
      name,
      in: 'query',
      description: value.description,
      required: get(value, 'flags.presence') === 'required',
      schema: addReference(value)
    }
  })
}

const parseBody = function (route) {
  // If there is a already defined format, use it
  const specObject = get(route, 'config.validate.payload')

  if (!specObject) return null

  return {
    description: specObject.description,
    content: {
      'application/json': {
        schema: addReference(specObject)
      }
    }
  }
}

module.exports = (function () {
  const routes = []

  return {
    addApiRoute (fastify, collection, routeSpec) {
      const options = {
        ...routeSpec,
        // attachValidation: true,
        async handler (request, reply) {
          // See https://www.fastify.io/docs/latest/Validation-and-Serialization/#error-handling
          /*
          if (request.validationError) {
              console.log('VALIDATIONERROR', request.validationError)
              reply.code = 422
            // TODO Return error - see validation.js
          }
          */
          return routeSpec.handler(request, reply)
        }
      }

      if (!routes[collection]) routes[collection] = []

      routes[collection].push(options)
      return fastify.route(options)
    },
    generateSpec (spec, collection) {
      // Sort by path
      const apiRoutes = routes[collection].sort((a, b) => a.path.localeCompare(b.path))

      // Add each route to the path
      for (const route of apiRoutes) {
        // Make sure routes are grouped by path
        const { path } = route
        if (!Object.prototype.hasOwnProperty.call(spec.paths, path)) spec.paths[path] = {}

        const { description, tags } = route.config

        // Add the route to the path group
        spec.paths[path][route.method.toLowerCase()] = {
          summary: description,
          tags: tags.filter(t => t !== 'api'),
          responses: parseResponses(route),
          requestBody: parseBody(route),
          parameters: [
            parseParameters(route),
            parseQuerystring(route)
          ].filter(l => l).reduce((a, b) => a.concat(b), [])
        }
      }

      return spec
    }
  }
})()
