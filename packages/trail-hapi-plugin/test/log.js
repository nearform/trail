const Lab = require('lab')
const lab = exports.lab = Lab.script()
const { expect } = require('code')

lab.experiment('Basic Log REST operations', () => {
  lab.before(async () => {
    server = await require('./test-server')()
  })

  lab.test('GET /logs/{id}', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/logs/1'
    })

    console.log(res.result)

    expect(1 + 1).to.equal(2)
  })
})