'use strict'

const { expect } = require('code')
const Lab = require('@hapi/lab')
const sinon = require('sinon')

module.exports.lab = Lab.script()
const { describe, it: test, before, after } = module.exports.lab

const testServer = require('./test-server')

describe('Server', () => {
  let server = null
  const stubs = []

  before(async () => {
    stubs.push(sinon.stub(process, 'exit').callsFake(code => {
      throw new Error(`EXITED - ${code}`)
    }))
    stubs.push(sinon.stub(global.console, 'log'))
    stubs.push(sinon.stub(global.console, 'error'))

    server = await testServer.buildDefault()
  })

  after(async () => {
    //await testServer.stopAll()
    stubs.map(c => c.restore())
  })

  describe('generic', () => {
    test('should log in case of listen errors', async () => {
      process.send = console.log
      await expect(testServer.build()).to.reject(Error, 'EXITED - 1')
      expect(stubs[1].called).to.be.true()
    })

    describe('GET /ping', async () => {
      test('it should return system information', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/ping'
        })

        expect(response.statusCode).to.equal(200)
        const payload = JSON.parse(response.payload)

        expect(payload.uptime).to.match(/^(\d+.\d{3} s)$/)
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

        expect(response.statusCode).to.equal(200)
        expect(response.payload).to.include('url: "/trails/openapi.json"')
      })

      test('it should correctly serve other files', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/documentation/swagger-ui-standalone-preset.js'
        })

        expect(response.statusCode).to.equal(200)
        expect(response.headers['content-type']).to.include('application/javascript')
      })
    })
  })
})
