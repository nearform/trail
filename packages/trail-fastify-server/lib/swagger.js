'use strict'

const { readFile } = require('fs').promises
const { extname, join } = require('path')

module.exports = async function (server, options) {
  // Patch the index file to serve our swagger.json
  const path = join(require('swagger-ui-dist').getAbsoluteFSPath(), 'index.html')
  const index = (await readFile(path, 'utf8'))
    .replace(
      /url: ".+"/,
      'url: "/trails/openapi.json"'
    )

  // Serve the rest of the UI
  server.route({
    method: 'GET',
    path: '/documentation/*',
    handler (request, reply) {
      const path = request.params['*']
      if (path === '' || path === 'index.html') {
        // Serve the patched index file
        reply.header('Content-Type', 'text/html')
        return reply.send(index)
      }
      // Force correct MIME type on JS files
      if (extname(path) === '.js') {
        reply.header('Content-Type', 'application/javascript')
      }
      reply.sendFile(path)
    }
  })
}
