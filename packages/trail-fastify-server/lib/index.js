const S = require('fluent-schema')
const fastify = require('fastify')
const config = require('config')
const { errorsSchemas } = require('@nearform/trail-fastify-plugin/lib/schemas/errors')
const { addApiRoute } = require('@nearform/trail-fastify-plugin/lib/api')

module.exports = async function () {
  // If forked as child, send output message via ipc to parent, otherwise output to console
  const logMessage = process.send ? process.send : console.log

  try {
    const startTime = process.hrtime()

    const server = fastify()

    server.register(require('fastify-static'), {
      root: require('swagger-ui-dist').getAbsoluteFSPath(),
      prefix: '/files'
    })
    server.register(require('./swagger'))
    server.register(require('@nearform/trail-fastify-plugin'), config)

    await addApiRoute(server, 'trails', {
      method: 'GET',
      path: '/ping',
      handler (request, reply) {
        const hrtime = process.hrtime(startTime)
        const uptime = `${hrtime[0]}.${(hrtime[1] / 1E6).toFixed(0)} s`
        reply.send({ uptime })
      },
      schema: {
        response: {
          200: S.object()
            .description('Successful uptime reply.')
            .additionalProperties(false)
            .prop('uptime', S.string().description('uptime in seconds').pattern(/^(\d+\.\d{3} s)$/).required()),
          500: errorsSchemas['500']
        }
      },
      config: {
        auth: false,
        description: 'Verifies if the service is up and return the uptime in seconds.',
        notes: 'The GET /ping endpoint will return 200 if the server is up and running.',
        tags: ['api', 'monitoring']
      }
    })

    const host = config.get('fastify.host')
    const port = parseInt(config.get('fastify.port'), 0)
    const addr = await server.listen(port, host)

    logMessage(`Server running at: ${addr}`)

    return server
  } catch (err) {
    logMessage(`Failed to start server: ${err.message}`)
    process.exit(1)
  }
}
