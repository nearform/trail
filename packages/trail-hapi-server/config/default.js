'use strict'

module.exports = {
  ...require('@nearform/trail-hapi-plugin/config/default'),
  logger: {
    pino: {
      level: 'warn'
    }
  }
}
