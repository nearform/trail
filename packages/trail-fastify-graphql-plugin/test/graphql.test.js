'use strict'

// Leak detection errors reported are caused by graphql-tools in graphql-compiler.js

const { expect } = require('@hapi/code')
const Lab = require('@hapi/lab')

module.exports.lab = Lab.script()
const { describe, it: test, before, after } = module.exports.lab

const { TrailsManager } = require('@nearform/trail-core')
const { makeQueryExecutor } = require('./graphql-compiler')

const convertToStringWithAttrs = val => {
  if (typeof val === 'string') {
    return { id: val, attributes: {} }
  }
  if (typeof val === 'undefined') {
    return {}
  }
  const { id, ...attributes } = val
  return { id, attributes }
}

const convertToTrail = ({ id, when, who, what, subject, where, why, meta }) => ({
  id,
  when: when,
  who: convertToStringWithAttrs(who),
  what: convertToStringWithAttrs(what),
  subject: convertToStringWithAttrs(subject),
  where: where || {},
  why: why || {},
  meta: meta || {}
})

const insertRecords = async (test, records) => {
  const { subject: { trailsManager } } = test
  await trailsManager.performDatabaseOperations(client => client.query('TRUNCATE trails'))
  const ids = await Promise.all(records.map(r => trailsManager.insert(r)))
  return ids
}

const getTrail = async (test, id) => {
  const { subject: { trailsManager } } = test
  const trail = await trailsManager.get(id)
  // The TrailsManager returns dates using luxon's DateTime format, but the graphql adapter uses
  // the string ISO format in its serialized output (for JSON compatibility); so do conversion
  // here before returning the result to be compared with expected output.
  if (trail) {
    trail.when = trail.when.toISO()
  }
  return trail
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
    test('get trail', async () => {
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

    test('get trails', async () => {
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

      const { data: { trails } } = await this.subject.execQuery(`{
        trails(from: "${from}", to: "${to}") {
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

      expect(trails).to.equal(expected)
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

      const { data: { enumerateTrails } } = await this.subject.execQuery(`{
        enumerateTrails(from: "${from}", to: "${to}", type: WHO)
      }`)

      const expected = records.map(r => r.who).sort().filter((w, i, a) => w !== a[i - 1])

      expect(enumerateTrails).to.equal(expected)
    })

    test('get trails multiple concurrent', async () => {
      const records = [
        { when: '2018-01-01T12:34:56.000Z', who: 'dog', what: 'open', subject: 'window' },
        { when: '2018-01-02T12:34:56.000Z', who: 'cat', what: 'open', subject: 'window' },
        { when: '2018-01-03T12:34:56.000Z', who: 'whale', what: 'close', subject: 'door' },
        { when: '2018-01-04T12:34:56.000Z', who: 'cat', what: 'close', subject: 'door' },
        { when: '2018-01-05T12:34:56.000Z', who: 'shark', what: 'check', subject: 'world' }
      ]

      const ids = await insertRecords(this, records)

      const { data } = await this.subject.execQuery(`{
        ${ids.map(id => `_${id}: trail(id: ${id}) { when, who, what, subject }\n`)}
      }`)

      ids.forEach((id, idx) => {
        const { when, who, what, subject } = convertToTrail(records[idx])
        expect(data[`_${id}`]).to.equal({ when, who, what, subject })
      })
    })
  })

  describe('Mutate', () => {
    test('insert', async () => {
      const when = '2018-01-01T12:34:56.000Z'
      const who = 'dog'
      const what = 'open'
      const subject = 'window'

      const { data: { trail } } = await this.subject.execQuery(`mutation {
        trail: insertTrail(when: "${when}", who: "${who}", what: "${what}", subject: "${subject}") {
          id
          when
          who
          what
          subject
          meta
          where
          why
        }
      }`)

      const { id } = trail

      expect(id).to.be.a.number()

      const expected = convertToTrail({ id, when, who, what, subject })

      expect(trail).to.equal(expected)
    })

    test('insert with args and attributes', async () => {
      const when = '2018-01-01T12:34:56.000Z'
      const who = { id: 'dog', a: 1 }
      const what = { id: 'open', b: '2' }
      const subject = 'window'

      const { data: { trail } } = await this.subject.execQuery(`mutation Insert(
        $when: Date!
        $who: StringWithAttrs!
        $what: StringWithAttrs!
        $subject: StringWithAttrs!
      ) {
        trail: insertTrail(when: $when, who: $who, what: $what, subject: $subject) {
          id
          when
          who
          what
          subject
          meta
          where
          why
        }
      }`, { when, who, what, subject })

      const { id } = trail

      expect(id).to.be.a.number()

      const expected = convertToTrail({ id, when, who, what, subject })

      expect(trail).to.equal(expected)
    })

    test('insert invalid', async () => {
      try {
        await this.subject.execQuery(`mutation {
          insertTrail(when: "")
        }`)
      } catch (e) {
        expect(e.message).to.equal('Query compilation error: Argument "who" of required type "StringWithAttrs!" was not provided.')
      }
    })

    test('insert with JSON values', async () => {
      const when = '2018-01-01T12:34:56.000Z'
      const who = 'dog'
      const what = 'open'
      const subject = 'window'
      const where = '{ where: "there" }'
      const why = '{ reason: "because" }'
      const meta = '{ meta0: 0, meta1: "one", meta2: [ 2 ] }'

      const { data: { trail } } = await this.subject.execQuery(`mutation {
        trail: insertTrail(when: "${when}", who: "${who}", what: "${what}", subject: "${subject}", where: ${where}, why: ${why}, meta: ${meta}) {
          id
          when
          who
          what
          subject
          meta
          where
          why
        }
      }`)

      const { id } = trail

      expect(id).to.be.a.number()

      const expected = convertToTrail({
        id,
        when,
        who,
        what,
        subject,
        where: { where: 'there' },
        why: { reason: 'because' },
        meta: { meta0: 0, meta1: 'one', meta2: [2] }
      })

      expect(trail).to.equal(expected)
    })

    test('update', async () => {
      const when = '2018-01-01T12:34:56.000Z'
      const who = 'dog'
      const what = 'open'
      const subject = 'window'
      const [id] = await insertRecords(this, [{ when, who, what, subject }])

      const newWhat = 'close'
      const { data: { trail } } = await this.subject.execQuery(`mutation {
        trail: updateTrail(id: ${id}, when: "${when}", who: "${who}", what: "${newWhat}", subject: "${subject}") {
          what
        }
      }`)

      // expect(ok).to.be.true()
      // const trail = await getTrail(this, id)
      expect(trail.what.id).to.equal(newWhat)
    })

    test('update partial', async () => {
      const when = '2018-01-01T12:34:56.000Z'
      const who = 'dog'
      const what = 'open'
      const subject = 'window'
      const [id] = await insertRecords(this, [{ when, who, what, subject }])

      const newWhat = 'close'
      const newSubject = 'door'
      const { data: { trail } } = await this.subject.execQuery(`mutation {
        trail: updateTrail(id: ${id}, what: "${newWhat}", subject: "${newSubject}") {
          what
          subject
        }
      }`)

      // expect(ok).to.be.true()
      // const trail = await getTrail(this, id)
      expect(trail.what.id).to.equal(newWhat)
      expect(trail.subject.id).to.equal(newSubject)
    })

    test('update with args and attributes', async () => {
      const when = '2018-01-01T12:34:56.000Z'
      const who = { id: 'dog', a: 1 }
      const what = { id: 'open', b: '2' }
      const subject = 'window'
      const [id] = await insertRecords(this, [{ when, who, what, subject }])

      const newWhat = 'close'
      const { data: { trail } } = await this.subject.execQuery(`mutation Update(
          $id: Int!,
          $when: Date!
          $who: StringWithAttrs!
          $what: StringWithAttrs!
          $subject: StringWithAttrs!
        ) {
        trail: updateTrail(id: $id, when: $when, who: $who, what: $what, subject: $subject) {
          what
        }
      }`, { id, when, who, what: newWhat, subject })

      // expect(ok).to.be.true()
      // const trail = await getTrail(this, id)
      expect(trail.what.id).to.equal(newWhat)
    })

    test('update invalid', async () => {
      const when = '2018-01-01T12:34:56.000Z'
      const who = 'dog'
      const what = 'open'
      const subject = 'window'
      const [id] = await insertRecords(this, [{ when, who, what, subject }])

      try {
        await this.subject.execQuery(`mutation {
          updateTrail(id: ${id}, when: "")
        }`)
      } catch (e) {
        expect(e.message).to.equal('Query compilation error: Argument "who" of required type "StringWithAttrs!" was not provided.')
      }
    })

    test('delete', async () => {
      const record = { when: '2018-01-01T12:34:56.000Z', who: 'dog', what: 'open', subject: 'window' }
      const [id] = await insertRecords(this, [record])

      const { data: { ok } } = await this.subject.execQuery(`mutation {
        ok: deleteTrail(id: ${id})
      }`)

      expect(ok).to.be.true()
      const trail = await getTrail(this, id)
      expect(trail).to.be.null()
    })

    test('delete nonexisting', async () => {
      const { data: { ok } } = await this.subject.execQuery(`mutation {
        ok: deleteTrail(id: 1)
      }`)
      expect(ok).to.be.false()
    })

    test('multiple concurrent', async () => {
      const records = [
        { when: '2018-01-01T12:34:56.000Z', who: 'dog', what: 'open', subject: 'window' },
        { when: '2018-01-02T12:34:56.000Z', who: 'cat', what: 'open', subject: 'window' }
      ]
      const ids = await insertRecords(this, records)
      const newTrail = { when: '2018-01-03T12:34:56.000Z', who: 'whale', what: 'close', subject: 'door' }
      const newWhat = 'close'

      const { data } = await this.subject.execQuery(`mutation {
        insert: insertTrail(when: "${newTrail.when}", who: "${newTrail.who}", what: "${newTrail.what}", subject: "${newTrail.subject}") {
          id
        }
        update: updateTrail(id: ${ids[0]}, when: "${records[0].when}", who: "${records[0].who}", what: "${newWhat}", subject: "${records[0].subject}") {
          id
        }
        remove: deleteTrail(id: ${ids[1]})
      }`)

      const { id } = data.insert
      const expected = convertToTrail({ id, ...newTrail })

      const trail = await getTrail(this, id)
      expect(trail).to.equal(expected)

      expect(data.update.id).to.equal(ids[0])
      expect(data.remove).to.equal(true)
    })
  })
})
