const Joi = require('@hapi/joi')
const config = require('config')
const { errorsSchemas } = require('@nearform/trail-hapi-plugin/lib/schemas/errors')
const { addApiRoute } = require('@nearform/trail-hapi-plugin/lib/api')

module.exports = async function () {
  // If forked as child, send output message via ipc to parent, otherwise output to console
  const logMessage = process.send ? process.send : console.log

  const server = require('@hapi/hapi').Server({
    host: config.get('hapi.host'),
    port: parseInt(config.get('hapi.port'), 0),
    routes: {
      files: {
        relativeTo: require('swagger-ui-dist').getAbsoluteFSPath()
      }
    }
  })
  server.validator(Joi)

  try {
    const startTime = process.hrtime()

    await server.register([
      {
        plugin: require('hapi-pino'),
        options: config.get('logger.pino')
      },
      {
        plugin: require('./swagger')
      },
      {
        plugin: require('@hapi/inert')
      },
      {
        plugin: require('@nearform/trail-hapi-plugin'),
        options: { config }
      }
    ])

    await addApiRoute(server, 'trails', {
      method: 'GET',
      path: '/ping',
      async handler (request, h) {
        const uptime = process.hrtime(startTime)
        return { uptime: `${uptime[0]}.${(uptime[1] / 1E6).toFixed(0)} s` }
      },
      config: {
        auth: false,
        description: 'Verifies if the service is up and return the uptime in seconds.',
        notes: 'The GET /ping endpoint will return 200 if the server is up and running.',
        tags: ['api', 'monitoring'],
        response: {
          status: {
            200: Joi.object({
              uptime: Joi.string().description('uptime in seconds').regex(/^(\d+\.\d{3} s)$/).required()
            })
              .description('Successful uptime reply.')
              .unknown(false),
            500: errorsSchemas['500']
          }
        }
      }
    })

    await server.start()
    logMessage(`Server running at: ${server.info.uri}`)

    return server
  } catch (err) {
    logMessage(`Failed to start server: ${err.message}`)
    process.exit(1)
  }
}
