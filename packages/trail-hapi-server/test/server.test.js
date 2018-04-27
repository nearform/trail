'use strict'

const testServer = require('./test-server')

describe('Server', () => {
  let server = null
  const mocks = []

  beforeAll(async () => {
    mocks.push(jest.spyOn(process, 'exit').mockImplementation(code => {
      throw new Error(`EXITED - ${code}`)
    }))
    mocks.push(jest.spyOn(global.console, 'log').mockImplementation(() => null))
    mocks.push(jest.spyOn(global.console, 'error').mockImplementation(() => null))

    server = await testServer.buildDefault()
  })

  afterAll(async () => {
    await testServer.stopAll()
    mocks.map(c => c.mockRestore())
  })

  describe('generic', () => {
    test('should log in case of listen errors', async () => {
      process.send = console.log
      await expect(testServer.build()).rejects.toThrow(new Error('EXITED - 1'))
      expect(mocks[1]).toHaveBeenCalled()
    })

    describe('GET /ping', async () => {
      test('it should return system information', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/ping'
        })

        expect(response.statusCode).toEqual(200)
        const payload = JSON.parse(response.payload)

        expect(payload).toMatchObject({uptime: expect.stringMatching(/^(\d+.\d{3} s)$/)})
      })
    })
  })

  describe('Swagger', () => {
    describe('JSON spec', () => {
      for (const url of ['/openapi.json', '/swagger.json']) {
        describe(`GET ${url}`, async () => {
          test('it should server the API spec file', async () => {
            const response = await server.inject({
              method: 'GET',
              url
            })

            expect(response.statusCode).toEqual(200)
            const payload = JSON.parse(response.payload)

            expect(payload).toMatchObject({
              openapi: '3.0.1'
            })
          })
        })
      }
    })

    describe(`UI`, async () => {
      test('it should correctly serve the index.html with the right spec URL', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/documentation/'
        })

        expect(response.statusCode).toEqual(200)
        expect(response.payload).toEqual(expect.stringContaining('url: "/openapi.json"'))
      })

      test('it should correctly serve other files', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/documentation/swagger-ui-standalone-preset.js'
        })

        expect(response.statusCode).toEqual(200)
        expect(response.headers['content-type']).toEqual(expect.stringContaining('application/javascript'))
      })
    })
  })
})
