'use strict'

const {readFileSync} = require('fs')
const {join} = require('path')

module.exports = {
  name: 'swagger-ui',
  version: '1.0.0',
  register: server => {
    // Patch the index file to serve our swagger.json
    const patchedIndexFile = readFileSync(join(require('swagger-ui-dist').getAbsoluteFSPath(), 'index.html'), 'utf8')
      .replace(
        /url: ".+"/,
        `url: "/trails/openapi.json"`
      )

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
