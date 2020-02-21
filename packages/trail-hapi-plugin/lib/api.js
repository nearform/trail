const { get } = require('lodash')
const j2s = require('joi-to-swagger')

const parseResponses = function (route, components) {
  const responses = {}
  const specObject = get(route, 'config.response.status')

  // Get the pairs and sort by HTTP code (lower first)
  const specPairs = Object.entries(specObject).sort((a, b) => a[0] - b[0])

  // For each response
  for (const [code, response] of specPairs) {
    const { swagger: schema } = j2s(response, components)

    if (code === '204') { // No body reply
      responses[code.toString()] = { description: schema.description }
    } else { // Assign the new response, either with a reference or by converting the object
      responses[code.toString()] = {
        description: schema.description,
        content: {
          'application/json': { schema }
        }
      }
    }
  }

  return responses
}

const parseSpecObject = function (specObject, scope, components) {
  if (!specObject) return null
  const { swagger: { properties = {}, required = [] } } = j2s(specObject, components)
  return Object.entries(properties).map(([name, schema]) => {
    return {
      name,
      in: scope,
      description: schema.description,
      required: required.includes(name),
      schema
    }
  })
}

const parseParameters = function (route, components) {
  return parseSpecObject(get(route, 'config.validate.params'), 'path', components)
}

const parseQuerystring = function (route, components) {
  return parseSpecObject(get(route, 'config.validate.query'), 'query', components)
}

const parseBody = function (route, components) {
  // If there is a already defined format, use it
  const specObject = get(route, 'config.validate.payload')

  if (!specObject) return null

  const { swagger: schema } = j2s(specObject, components)

  return {
    description: schema.description,
    content: {
      'application/json': { schema }
    }
  }
}

module.exports = (function () {
  const routes = []

  return {
    addApiRoute (server, collection, routeSpec) {
      if (!routes[collection]) routes[collection] = []

      routes[collection].push(routeSpec)
      return server.route(routeSpec)
    },
    generateSpec (spec, components, collection) {
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
          responses: parseResponses(route, components),
          requestBody: parseBody(route, components),
          parameters: [
            parseParameters(route, components),
            parseQuerystring(route, components)
          ].filter(l => l).reduce((a, b) => a.concat(b), [])
        }
      }

      return spec
    }
  }
})()
