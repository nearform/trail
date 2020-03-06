const serverFactory = require('../lib/index')

const options = {
    dbName: 'trails_test'
}

module.exports = (function () {
  let defaultServer = null
  const servers = []

  const build = async function (additionalConfig) {
      console.error('BUILD')
    const server = await serverFactory({ ...options, ...additionalConfig })
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
      return Promise.all(servers.map(s => s.close()))
    }
  }
})()
