'use strict'

module.exports = {
  name: 'log',
  register: (server, options) => {
    server.route({
      method: 'GET',
      path: '/logs/{id}',
      async handler (request) {
        const { id } = request.params
        return request.trail.get(id)
      },
      config: {
        auth: false,
        description: 'GET log by ID',
        notes: 'Retrieves the log for a given log ID',
        tags: ['api', 'log']
      }
    })

    server.route({
      method: 'POST',
      path: '/logs',
      async handler (request) {
        return request.trail.insert(request.payload)
      },
      config: {
        auth: false,
        description: 'POST a log item',
        notes: 'Inserts a log item',
        tags: ['api', 'log']
      }
    })
  }
}
