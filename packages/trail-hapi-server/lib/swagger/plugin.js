'use strict'

const {readFileSync} = require('fs')
const {get} = require('lodash')
const {join} = require('path')
const joiToSchema = require('joi-to-json-schema')

const addReference = function (spec) {
  const info = typeof spec.describe === 'function' ? spec.describe() : spec
  const id = get(info, 'meta.0.id')

  if (id) return {$ref: `#/components/${id}`}
  else if (spec.isJoi) return joiToSchema(spec)
  else return spec
}

const parseResponses = function (route) {
  const responses = {}
  let specObject = get(route, 'settings.response.status')

  // Get the pairs and sort by HTTP code (lower first)
  const specPairs = Object.entries(specObject).sort((a, b) => a[0] - b[0])

  // For each response
  for (const [code, response] of specPairs) {
    // Get its info and any reference id
    const info = response.describe()

    if (code === '204') { // No body reply
      responses[code.toString()] = {description: info.description}
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
  let specObject = get(route, 'settings.validate.params')

  if (!specObject) return null

  return Object.entries(specObject.describe().children).map(([name, spec]) => ({
    name,
    in: 'path',
    description: spec.description,
    required: get(spec, 'flags.presence') === 'required',
    schema: addReference(spec)
  }))
}

const parseQuerystring = function (route) {
  // If there is a already defined format, use it
  let specObject = get(route, 'settings.validate.query')

  if (!specObject) return null

  return Object.entries(specObject.describe().children).map(([name, spec]) => ({
    name,
    in: 'query',
    description: spec.description,
    required: get(spec, 'flags.presence') === 'required',
    schema: addReference(spec)
  }))
}

const parseBody = function (route) {
  // If there is a already defined format, use it
  let specObject = get(route, 'settings.validate.payload')

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

const addRoutes = function (spec, server) {
  // Filter by route mapped with 'api' tag, then sort by path
  const apiRoutes = server.table()
    .filter(r => {
      const tags = get(r, 'settings.tags')
      return Array.isArray(tags) && tags.includes('api')
    })
    .sort((a, b) => a.path.localeCompare(b.path))

  // Add each route to the path
  for (const route of apiRoutes) {
    // Make sure routes are grouped by path
    const path = route.path
    if (!spec.paths.hasOwnProperty(path)) spec.paths[path] = {}

    const {description, tags} = route.settings

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

module.exports = {
  name: 'swagger-ui',
  version: '1.0.0',
  register: server => {
    // Patch the index file to serve our swagger.json
    const patchedIndexFile = readFileSync(join(require('swagger-ui-dist').getAbsoluteFSPath(), 'index.html'), 'utf8')
      .replace(
        /url: ".+"/,
        `url: "/openapi.json"`
      )

    let swaggerJson = require('./spec')

    // Add tagged routes to the swagger.json
    server.ext('onPostStart', server => addRoutes(swaggerJson, server))

    // Add routes for the spec
    for (const path of ['/openapi.json', '/swagger.json']) {
      server.route({
        method: 'GET',
        path,
        handler (request, h) {
          return h.response(swaggerJson)
        }
      })
    }

    // Override the served UI index file
    server.ext('onPreResponse', (request, h) => {
      if (request.path.match(/^\/documentation(\/|(\/index\.html))$/) && request.response.statusCode === 200) return h.response(patchedIndexFile)
      return h.continue
    })

    // Serve the rest of the UI
    server.dependency('inert', () => {
      server.route({
        method: 'GET',
        path: '/documentation/{param*}',
        handler: {
          directory: {
            path: '.',
            redirectToSlash: true,
            index: true
          }
        }
      })
    })
  }
}
