'use strict'

const fastify = require('fastify')

const { TrailsManager } = require('@nearform/trail-core')

module.exports = (function () {
  let defaultServer = null
  let port = 8080
  const servers = []

  const build = async function (opts = {}) {
    const server = fastify({ logger: false })
    try {
      const trailsManager = new TrailsManager({ db: { database: 'trails_test' } })
      await server.register(require('../lib'), { trailsManager, ...opts })
      server.decorate('trailCore', trailsManager)
      await server.listen(port++, '127.0.0.1')
      servers.push(server)
    } catch (e) {
      console.error(e)
    }
    return server
  }

  return {
    build,
    async buildDefault (force) {
      if (!defaultServer || force) defaultServer = await build()

      return defaultServer
    },
    stopAll () {
      return Promise.all(servers.map(s => s.close()))
    }
  }
})()
