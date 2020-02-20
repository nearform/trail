module.exports = {
  ...require('@nearform/trail-fastify-plugin/config/default'),
  logger: {
    pino: {
      level: 'warn'
    }
  }
}
