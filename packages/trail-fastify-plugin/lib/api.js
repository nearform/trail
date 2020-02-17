const { get } = require('lodash')

const addReference = function (spec) {
  const info = typeof spec.describe === 'function' ? spec.describe() : spec
  const id = get(info, 'metas.0.id')

  if (id) return { $ref: `#/components/${id}` }
  else if (spec.isJoi) return JSON.stringify(info)
  else return spec
}

const parseResponses = function (route) {
  const responses = {}
  const specObject = get(route, 'config.response.status')

  // Get the pairs and sort by HTTP code (lower first)
  const specPairs = Object.entries(specObject).sort((a, b) => a[0] - b[0])

  // For each response
  for (const [code, response] of specPairs) {
    // Get its info and any reference id
    const info = response.describe()

    if (code === '204') { // No body reply
      responses[code.toString()] = { description: info.description }
    } else { // Assign the new response, either with a reference or by converting the object
      responses[code.toString()] = {
        description: info.description,
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
    const info = spec.describe()

    return {
      name,
      in: 'path',
      description: info.description,
      required: get(info, 'flags.presence') === 'required',
      schema: addReference(info)
    }
  })
}

const parseQuerystring = function (route) {
  // If there is a already defined format, use it
  const specObject = get(route, 'config.validate.query')

  if (!specObject) return null

  const spec = specObject.describe().keys
  return Object.entries(spec).map(([name, info]) => {
    return {
      name,
      in: 'query',
      description: info.description,
      required: get(info, 'flags.presence') === 'required',
      schema: addReference(info)
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
      if (!routes[collection]) routes[collection] = []

      routes[collection].push(routeSpec)
      return fastify.route(routeSpec)
    },
    generateSpec (spec, collection) {
      // Sort by path
      const apiRoutes = routes[collection].sort((a, b) => a.path.localeCompare(b.path))

      // Add each route to the path
      for (const route of apiRoutes) {
        // Make sure routes are grouped by path
        const path = route.path
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
