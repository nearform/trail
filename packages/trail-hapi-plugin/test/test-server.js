'use strict'

const Hapi = require('@hapi/hapi')

module.exports = (function () {
  let defaultServer = null
  let port = 8080
  const servers = []

  const build = async function (additionalConfig) {
    const server = Hapi.Server({
      host: '127.0.0.1',
      port: port++,
      ...additionalConfig
    })

    server.validator(require('@hapi/joi'))

    await server.register({ plugin: require('../lib/index') })
    await server.start()

    servers.push(server)
    return server
  }

  return {
    build,
    async buildDefault (additionalConfig, force) {
      if (!defaultServer || force) defaultServer = await build(additionalConfig)

      return defaultServer
    },
    stopAll () {
      return Promise.all(servers.map(s => s.stop()))
    }
  }
})()
