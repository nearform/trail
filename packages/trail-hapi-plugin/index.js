'use strict'

const {TrailsManager} = require('../trail-core')

exports.plugin = {
  pkg: require('./package'),

  register: async (server, options) => {
    const trail = new TrailsManager(undefined, options.pool)

    server.decorate('server', 'trailCore', trail)

    await server.register(require('./lib/routes/log'))
  }
}
