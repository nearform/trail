const sinon = require('sinon')

const testServer = require('./test-server')

describe('Server', () => {
  let server = null
  const stubs = []

  beforeAll(async () => {
    stubs.push(sinon.stub(process, 'exit').callsFake(code => {
      throw new Error(`EXITED - ${code}`)
    }))
    stubs.push(sinon.stub(global.console, 'log'))
    stubs.push(sinon.stub(global.console, 'error'))

    server = await testServer.buildDefault()
  })

  afterAll(async () => {
    stubs.map(c => c.restore())
  })

  describe('generic', () => {
    test('should log in case of listen errors', async () => {
      process.send = console.log
      await expect(testServer.build()).rejects.toThrow('EXITED - 1')
      expect(stubs[1].called).toBe(true)
    })

    describe('GET /ping', async () => {
      test('it should return system information', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/ping'
        })

        expect(response.statusCode).toEqual(200)
        const payload = JSON.parse(response.payload)

        expect(payload.uptime).toMatch(/^(\d+.\d+ s)$/)
      })
    })
  })

  describe('Swagger', () => {
    describe('UI', async () => {
      test('it should correctly serve the index.html with the right spec URL', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/documentation/'
        })

        expect(response.statusCode).toEqual(200)
        expect(response.payload).toMatch('url: "/trails/openapi.json"')
      })

      test('it should correctly serve other files', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/documentation/swagger-ui-standalone-preset.js'
        })

        expect(response.statusCode).toEqual(200)
        expect(response.headers['content-type']).toMatch('application/javascript')
      })
    })
  })
})
