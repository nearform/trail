'use strict'

const { expect } = require('@hapi/code')
const Lab = require('@hapi/lab')
const sinon = require('sinon')

module.exports.lab = Lab.script()
const { describe, it: test, before, after } = module.exports.lab

const { TrailsManager } = require('@nearform/trail-core')
const { convertToTrail } = require('@nearform/trail-core/lib/trail')
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

const getTrail = (test, id) => {
  const { subject: { trailsManager } } = test
  return trailsManager.get(id)
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
      const when = '2018-01-01T12:34:56.000Z'
      const who = 'dog cat fish'
      const what = 'open morning'
      const subject = 'window'

      const record = { when, who, what, subject }
      const [id] = await insertRecords(this, [record])

      const { data: { trail } } = await this.subject.execQuery(`{
          trail(id: ${id}) {
            id
            when
            who
            what
            subject
            where
            why
            meta
          }
        }`)

      const expected = convertToTrail({ id, ...record })
      expect(trail).to.equal(expected)
    })

    test('search', async () => {
      const records = [
        { when: '2018-01-01T12:34:56.000Z', who: 'dog', what: 'open', subject: 'window' },
        { when: '2018-01-02T12:34:56.000Z', who: 'cat', what: 'open', subject: 'window' },
        { when: '2018-01-03T12:34:56.000Z', who: 'whale', what: 'close', subject: 'door' },
        { when: '2018-01-04T12:34:56.000Z', who: 'cat', what: 'close', subject: 'door' },
        { when: '2018-01-05T12:34:56.000Z', who: 'shark', what: 'check', subject: 'world' }
      ]

      await insertRecords(this, records)

      const from = records[0].when
      const to = records[records.length - 1].when

      const { data: { search } } = await this.subject.execQuery(`{
        search(from: "${from}", to: "${to}") {
          when
          who
          what
          subject
        }
      }`)

      const expected = records
        .map(record => {
          const { when, who, what, subject } = convertToTrail(record)
          return { when, who, what, subject }
        })
        .reverse()

      expect(search).to.equal(expected)
    })

    test('enumerate', async () => {
      const records = [
        { when: '2018-01-01T12:34:56.000Z', who: 'dog', what: 'open', subject: 'window' },
        { when: '2018-01-02T12:34:56.000Z', who: 'cat', what: 'open', subject: 'window' },
        { when: '2018-01-03T12:34:56.000Z', who: 'whale', what: 'close', subject: 'door' },
        { when: '2018-01-04T12:34:56.000Z', who: 'cat', what: 'close', subject: 'door' },
        { when: '2018-01-05T12:34:56.000Z', who: 'shark', what: 'check', subject: 'world' }
      ]

      await insertRecords(this, records)

      const from = records[0].when
      const to = records[records.length - 1].when

      const { data: { enumerate } } = await this.subject.execQuery(`{
        enumerate(from: "${from}", to: "${to}", type: WHO)
      }`)

      const expected = records.map(r => r.who).sort().filter((w, i, a) => w !== a[i - 1])

      expect(enumerate).to.equal(expected)
    })
  })

  describe('Mutate', () => {
    test('insert', async () => {
      const when = '2018-01-01T12:34:56.000Z'
      const who = 'dog'
      const what = 'open'
      const subject = 'window'

      const { data: { insert: id } } = await this.subject.execQuery(`mutation {
            insert(when: "${when}", who: "${who}", what: "${what}", subject: "${subject}")
          }`)

      expect(id).to.be.a.number()

      const expected = convertToTrail({ id, when, who, what, subject })

      const trail = await getTrail(this, id)
      expect(trail).to.equal(expected)
    })
      // TODO insert using string data - { id: 'xxx' } and with attrs - { id: 'xxx', a: 1, b: 2 }
    /*
      test('insert invalid', async () => {
          const id = await this.subject.execQuery(`{
            insert()
          }`)
          expect(id).to.be.null()
      })
      test('update', async () => {
          const trail = { when: '2018-01-01T12:34:56.000Z', who: 'dog', what: 'open', subject: 'window' }
          const [ id ] = await insertRecords(this, [trail])
          const newWhat = 'close'
          const ok = await this.subject.execQuery(`{
            update(id: ${id}, what: "${newWhat}")
          }`)
          expect(ok).to.be.true()
          const { what } = await getRecord(this, id)
          expect(what).to.equal(newWhat)
      })
      test('update nonexisting', async () => {
          const ok = await this.subject.execQuery(`{
            update(id: ${id}, what: "xxx")
          }`)
          expect(ok).to.be.false()
      })
      test('delete', async () => {
          const trail = { when: '2018-01-01T12:34:56.000Z', who: 'dog', what: 'open', subject: 'window' }
          const [ id ] = await insertRecords(this, [trail])
          const ok = await this.subject.execQuery(`{
            delete(id: ${id})
          }`)
          expect(ok).to.be.true()
          const record = await getRecord(this, id)
          expect(record).to.be.null()
      })
      test('delete nonexisting', async () => {
          const ok = await this.subject.execQuery(`{
            delete(id: 12345)
          }`)
          expect(ok).to.be.false()
      })
      */
  })
})
