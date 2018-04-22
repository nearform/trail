const Hapi = require('hapi')
const { Pool } = require('pg')

let server = null

module.exports = async function (additionalConfig, port) {
  if (server && !port) return server

  server = Hapi.Server({
    port: Number(8080),
    host: '127.0.0.1',
    debug: false,
    routes: {
      cors: {
        additionalHeaders: ['org']
      },
      validate: { // This is to propagate validation keys in Hapi v17 - https://github.com/hapijs/hapi/issues/3706#issuecomment-349765943
        async failAction (request, h, err) {
          throw err
        }
      }
    }
  })

  const pool = new Pool({
        "host": "localhost",
        "port": 5432,
        "database": "audit_test",
        "username": "postgres",
        "password": "postgres",
        "poolSize": 10,
        "idleTimeoutMillis": 30000
  })
  
  await server.register({plugin: require('..'), options: {pool}})

  await server.start()

  return server
}
