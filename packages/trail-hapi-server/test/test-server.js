'use strict'

const serverFactory = require('../lib/index')

module.exports = (function () {
  let defaultServer = null
  const servers = []

  const build = async function (additionalConfig) {
    const server = await serverFactory()
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
