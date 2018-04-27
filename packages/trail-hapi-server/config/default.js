'use strict'

module.exports = {
  ...require('@nearform/trail-hapi-plugin/config/default'),
  hapi: {
    host: 'localhost',
    port: 8080
  },
  logger: {
    pino: {
      level: 'warn'
    }
  }
}
