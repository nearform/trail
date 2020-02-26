'use strict'

const { expect } = require('@hapi/code')
const Lab = require('@hapi/lab')
const sinon = require('sinon')

module.exports.lab = Lab.script()
const { describe, it: test, before, after } = module.exports.lab

// const SQL = require('@nearform/sql')
// const { DateTime } = require('luxon')

const { TrailsManager } = require('@nearform/trail-core')
const { makeQueryExecutor } = require('../lib/compiler')

const sampleTrail = function () {
  const date = DateTime.fromISO('2018-04-11T07:00:00.123-09:00', { setZone: true })
  return { id: null, when: date, who: 'who', what: { id: 'what', additional: true }, subject: 'subject' }
}

const insertRecords = async (test, records) => {
  const { subject: { trailsManager } } = test
  await trailsManager.performDatabaseOperations(client => client.query('TRUNCATE trails'))
  const ids = await Promise.all(records.map(r => trailsManager.insert(r)))
  return ids
}

describe('GraphQL', () => {
  before(() => {
    const trailsManager = new TrailsManager()
    const execQuery = makeQueryExecutor({ trailsManager })
    this.subject = { trailsManager, execQuery }
  })

  after(async () => {
    const { trailsManager } = this.subject
    await trailsManager.performDatabaseOperations(client => client.query('TRUNCATE trails'))
    await trailsManager.close()
  })

  describe('Query', () => {
    test('get', async () => {
      const trail = { when: '2018-01-01T12:34:56.000Z', who: 'dog cat fish', what: 'open morning', subject: 'window' }
      const [id] = await insertRecords(this, [trail])

      const result = await this.subject.execQuery(`{
          trail(id: ${id}) {
            when
            who
            what
            subject
          }
        }`)

      expect(result).to.equal({ data: { trail } })
    })

    test('search', async () => {
      const trails = [
        { when: '2018-01-01T12:34:56.000Z', who: 'dog', what: 'open', subject: 'window' },
        { when: '2018-01-02T12:34:56.000Z', who: 'cat', what: 'open', subject: 'window' },
        { when: '2018-01-03T12:34:56.000Z', who: 'whale', what: 'close', subject: 'door' },
        { when: '2018-01-04T12:34:56.000Z', who: 'cat', what: 'close', subject: 'door' },
        { when: '2018-01-05T12:34:56.000Z', who: 'shark', what: 'check', subject: 'world' }
      ]

      await insertRecords(this, trails)

      const from = trails[0].when
      const to = trails[trails.length - 1].when

      const result = await this.subject.execQuery(`{
        search(from: "${from}", to: "${to}") {
          when
          who
          what
          subject
        }
      }`)

      // An array of trails in reverse order.
      const search = trails.slice().reverse()
      expect(result).to.equal({ data: { search } })
    })

    test('enumerate', async () => {
      const trails = [
        { when: '2018-01-01T12:34:56.000Z', who: 'dog', what: 'open', subject: 'window' },
        { when: '2018-01-02T12:34:56.000Z', who: 'cat', what: 'open', subject: 'window' },
        { when: '2018-01-03T12:34:56.000Z', who: 'whale', what: 'close', subject: 'door' },
        { when: '2018-01-04T12:34:56.000Z', who: 'cat', what: 'close', subject: 'door' },
        { when: '2018-01-05T12:34:56.000Z', who: 'shark', what: 'check', subject: 'world' }
      ]

      await insertRecords(this, trails)

      const from = trails[0].when
      const to = trails[trails.length - 1].when

      const result = await this.subject.execQuery(`{
        enumerate(from: "${from}", to: "${to}", type: WHO)
      }`)

      // An enumeration of trail 'who' values in unique alphabetical order.
      const enumerate = trails.map(t => t.who).sort().filter((w,i,a) => w !== a[i - 1])
      expect(result).to.equal({ data: { enumerate } })
    })
  })
})
