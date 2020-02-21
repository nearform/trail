const { get } = require('lodash')

const addReference = function (spec) {
  const value = typeof spec.valueOf === 'function' ? spec.valueOf() : spec
  const id = get(value, 'meta.id')
  return id ? { $ref: `#/components/${id}` } : value
}

const parseResponses = function (route) {
  const responses = {}
  const specObject = get(route, 'schema.response', {})

  // Get the pairs and sort by HTTP code (lower first)
  const specPairs = Object.entries(specObject).sort((a, b) => a[0] - b[0])

  // For each response
  for (const [code, response] of specPairs) {
    // Get its value and any reference id
    const { description } = response.valueOf()

    if (code === '204') { // No body reply
      responses[code] = { description }
    } else { // Assign the new response, either with a reference or by converting the object
      responses[code] = {
        description,
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

const parseSpecObject = function (specObject, scope) {
  if (!specObject) return null

  const { required = [], properties = {} } = specObject.valueOf()

  return Object.entries(properties).map(([name, spec]) => {
    return {
      name,
      in: scope,
      description: spec.description,
      required: required.includes(name),
      schema: addReference(spec)
    }
  })
}

const parseParameters = function (route) {
  return parseSpecObject(get(route, 'schema.params'), 'path')
}

const parseQuerystring = function (route) {
  return parseSpecObject(get(route, 'schema.query'), 'query')
}

const parseBody = function (route) {
  // If there is a already defined format, use it
  const specObject = get(route, 'schema.body')

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
