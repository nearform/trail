'use strict'

const SQL = require('@nearform/sql')
const {DateTime} = require('luxon')
require('./utils')

const {TrailsManager} = require('../lib')

expect.extend({
  toBeSameDate (received, argument) {
    if (typeof argument === 'string') argument = DateTime.fromISO(argument)
    const pass = received.toUTC().equals(argument.toUTC())

    if (pass) {
      return {pass: true, message: () => `expected ${received.toISO()} not to be same date as ${argument.toISO()}`}
    } else {
      return {pass: false, message: () => `expected ${received.toISO()} to be same date as ${argument.toISO()}`}
    }
  }
})

const sampleTrail = function () {
  const date = DateTime.fromISO('2018-04-11T07:00:00.123-09:00', {setZone: true})
  return {id: null, when: date, who: 'who', what: {id: 'what', additional: true}, subject: 'subject'}
}

describe('TrailsManager', () => {
  beforeAll(() => {
    this.subject = new TrailsManager()
  })

  afterAll(async () => {
    await this.subject.performDatabaseOperations(client => client.query('TRUNCATE trails'))
    await this.subject.close()
  })

  describe('.performDatabaseOperations', () => {
    test('should rollback transaction when something bad happens', async () => {
      const count = parseInt((await this.subject.performDatabaseOperations(client => client.query('SELECT COUNT(*) FROM trails'), false)).rows[0].count, 0)

      try {
        await this.subject.performDatabaseOperations(async client => {
          await client.query(SQL`
            INSERT
              INTO trails ("when", who_id, what_id, subject_id, who_data, what_data, subject_data, "where", why, meta)
              VALUES('2018-01-01T12:34:56+00:00', 'who', 'what', 'subject', ${{}}, ${{}}, ${{}}, ${{}}, ${{}}, ${{}})
          `)
          throw new Error('rollback please')
        })
      } catch (e) {
        expect(e.message).toEqual('rollback please')
      }

      const newCount = parseInt((await this.subject.performDatabaseOperations(client => client.query('SELECT COUNT(*) FROM trails'), false)).rows[0].count, 0)
      expect(newCount).toEqual(count)
    })

    test('should not use transaction if requested to ', async () => {
      const count = parseInt((await this.subject.performDatabaseOperations(client => client.query('SELECT COUNT(*) FROM trails'), false)).rows[0].count, 0)

      try {
        await this.subject.performDatabaseOperations(async client => {
          await client.query(SQL`
            INSERT
              INTO trails ("when", who_id, what_id, subject_id, who_data, what_data, subject_data, "where", why, meta)
              VALUES('2018-01-01T12:34:56+00:00', 'who', 'what', 'subject', ${{}}, ${{}}, ${{}}, ${{}}, ${{}}, ${{}})
          `)
          throw new Error('rollback please')
        }, false)
      } catch (e) {
        expect(e.message).toEqual('rollback please')
      }

      const newCount = parseInt((await this.subject.performDatabaseOperations(client => client.query('SELECT COUNT(*) FROM trails'), false)).rows[0].count, 0)

      expect(newCount).toEqual(count + 1)
    })

    test('should raise an error when db pool is empty', async () => {
      const badSubject = new TrailsManager(null, null)

      expect(badSubject.performDatabaseOperations(client => client.query('TRUNCATE trails')))
        .rejects.toEqual(new Error('Cannot read property \'connect\' of null'))
    })
  })

  describe('.close', () => {
    test('should raise an error when something bad happens', async () => {
      const badSubject = new TrailsManager(null, null)

      await expect(badSubject.close()).rejects.toEqual(new TypeError("Cannot read property 'end' of null"))
    })
  })

  describe('.search', () => {
    test('should return the right records', async () => {
      await this.subject.performDatabaseOperations(client => client.query('TRUNCATE trails'))

      const records = [
        {when: '2018-01-01T12:34:56+00:00', who: 'dog cat fish', what: 'open morning', subject: 'window'},
        {when: '2018-01-02T12:34:56+00:00', who: 'dog cat shark', what: 'open evening', subject: 'window'},
        {when: '2018-01-03T12:34:56+00:00', who: 'wolf cat whale', what: 'open morning', subject: 'door'},
        {when: '2018-01-04T12:34:56+00:00', who: 'hyena lion fish', what: 'close evening', subject: 'door'},
        {when: '2018-01-05T12:34:56+00:00', who: 'hyena tiger whal', what: 'close night', subject: 'world'}
      ]

      const ids = await Promise.all(records.map(r => this.subject.insert(r)))

      expect((await this.subject.search({from: '2018-01-01T11:00:00+00:00', to: '2018-01-04T13:34:56+00:00', who: 'dog', sort: 'when'}))
        .map(r => r.id)).toEqual([ids[0], ids[1]])

      expect((await this.subject.search({from: '2018-01-01T15:00:00+00:00', to: '2018-01-04T13:34:56+00:00', what: 'evening', sort: 'id'}))
        .map(r => r.id)).toEqual([ids[1], ids[3]].sort())

      expect((await this.subject.search({from: '2018-01-01T15:00:00+00:00', to: '2018-01-04T13:34:56+00:00', what: 'evening', sort: '-subject'}))
        .map(r => r.id)).toEqual([ids[1], ids[3]])

      expect((await this.subject.search({from: '2018-01-01T15:00:00+00:00', to: '2018-01-05T13:34:56+00:00', subject: 'world'}))
        .map(r => r.id)).toEqual([ids[4]])

      expect((await this.subject.search({from: '2018-01-01T15:00:00+00:00', to: '2018-01-05T13:34:56+00:00', what: 'world'}))
        .map(r => r.id)).toEqual([])

      expect((await this.subject.search({from: '2018-01-01T00:00:00+00:00', to: '2018-01-05T13:34:56+00:00', sort: 'when', page: 2, pageSize: 2}))
        .map(r => r.id)).toEqual([ids[2], ids[3]])

      await Promise.all(ids.map(i => this.subject.delete(i)))
    })

    test('should validate parameters', async () => {
      await expect(this.subject.search()).rejects.toEqual(new Error('You must specify a starting date ("from" attribute) when querying trails.'))
      await expect(this.subject.search({from: DateTime.local()}))
        .rejects.toEqual(new Error('You must specify a ending date ("to" attribute) when querying trails.'))

      await expect(this.subject.search({from: 'whatever', to: DateTime.local()}))
        .rejects.toEqual(new Error('Invalid date "whatever". Please specify a valid UTC date in ISO8601 format.'))
      await expect(this.subject.search({from: DateTime.local(), to: DateTime.local(), who: 1}))
        .rejects.toEqual(new Error('Only strings are supporting for searching in the id of the "who" field.'))
      await expect(this.subject.search({from: DateTime.local(), to: DateTime.local(), what: 1}))
        .rejects.toEqual(new Error('Only strings are supporting for searching in the id of the "what" field.'))
      await expect(this.subject.search({from: DateTime.local(), to: DateTime.local(), subject: 1}))
        .rejects.toEqual(new Error('Only strings are supporting for searching in the id of the "subject" field.'))
      await expect(this.subject.search({from: DateTime.local(), to: DateTime.local(), sort: '-metadata'}))
        .rejects.toEqual(new Error('Only "id", "when", "who", "what" and "subject" are supported for sorting.'))
    })

    test('should sanitize pagination parameters', async () => {
      const spy = jest.spyOn(this.subject, 'performDatabaseOperations')

      await this.subject.search({from: DateTime.local(), to: DateTime.local(), page: 12})
      expect(spy.mock.calls[0][0].text).toEqual(expect.stringContaining('LIMIT 25 OFFSET 275'))

      await this.subject.search({from: DateTime.local(), to: DateTime.local(), pageSize: 12})
      expect(spy.mock.calls[1][0].text).toEqual(expect.stringContaining('LIMIT 12 OFFSET 0'))

      await this.subject.search({from: DateTime.local(), to: DateTime.local(), page: 3, pageSize: 12})
      expect(spy.mock.calls[2][0].text).toEqual(expect.stringContaining('LIMIT 12 OFFSET 24'))

      await this.subject.search({from: DateTime.local(), to: DateTime.local(), page: '12', pageSize: NaN})
      expect(spy.mock.calls[3][0].text).toEqual(expect.stringContaining('LIMIT 25 OFFSET 275'))

      await this.subject.search({from: DateTime.local(), to: DateTime.local(), page: NaN, pageSize: 2})
      expect(spy.mock.calls[4][0].text).toEqual(expect.stringContaining('LIMIT 2 OFFSET 0'))
    })
  })

  describe('.enumerate', () => {
    test('should return the right records', async () => {
      await this.subject.performDatabaseOperations(client => client.query('TRUNCATE trails'))

      const records = [
        {when: '2018-01-01T12:34:56+00:00', who: 'dog', what: 'open', subject: 'window'},
        {when: '2018-01-02T12:34:56+00:00', who: 'cat', what: 'open', subject: 'window'},
        {when: '2018-01-03T12:34:56+00:00', who: 'whale', what: 'close', subject: 'door'},
        {when: '2018-01-04T12:34:56+00:00', who: 'cat', what: 'close', subject: 'door'},
        {when: '2018-01-05T12:34:56+00:00', who: 'shark', what: 'check', subject: 'world'}
      ]

      const ids = await Promise.all(records.map(r => this.subject.insert(r)))

      expect((await this.subject.enumerate({from: '2018-01-01T11:00:00+00:00', to: '2018-01-04T13:34:56+00:00', type: 'who'})))
        .toEqual(['cat', 'dog', 'whale'])

      expect((await this.subject.enumerate({from: '2018-01-01T15:00:00+00:00', to: '2018-01-04T13:34:56+00:00', type: 'what'})))
        .toEqual(['close', 'open'])

      expect((await this.subject.enumerate({from: '2018-01-01T11:00:00+00:00', to: '2018-01-04T13:34:56+00:00', type: 'who', desc: true})))
        .toEqual(['whale', 'dog', 'cat'])

      expect((await this.subject.enumerate({from: '2018-01-01T15:00:00+00:00', to: '2018-01-05T13:34:56+00:00', type: 'who'})))
        .toEqual(['cat', 'shark', 'whale'])

      expect((await this.subject.enumerate({from: '2018-01-01T15:00:00+00:00', to: '2018-01-05T13:34:56+00:00', type: 'what'})))
        .toEqual(['check', 'close', 'open'])

      expect((await this.subject.enumerate({from: '2018-01-01T00:00:00+00:00', to: '2018-01-05T13:34:56+00:00', type: 'who', page: 2, pageSize: 1})))
        .toEqual(['dog'])

      expect((await this.subject.enumerate({from: '2018-02-01T11:00:00+00:00', to: '2018-02-04T13:34:56+00:00', type: 'who'}))).toEqual([])

      await Promise.all(ids.map(i => this.subject.delete(i)))
    })

    test('should validate parameters', async () => {
      await expect(this.subject.enumerate()).rejects.toEqual(new Error('You must specify a starting date ("from" attribute) when enumerating.'))
      await expect(this.subject.enumerate({from: DateTime.local()}))
        .rejects.toEqual(new Error('You must specify a ending date ("to" attribute) when enumerating.'))

      await expect(this.subject.enumerate({from: 'whatever', to: DateTime.local()}))
        .rejects.toEqual(new Error('Invalid date "whatever". Please specify a valid UTC date in ISO8601 format.'))
      await expect(this.subject.enumerate({from: DateTime.local(), to: DateTime.local(), type: 'foo'}))
        .rejects.toEqual(new Error('You must select between "who", "what" or "subject" type ("type" attribute) when enumerating.'))
    })

    test('should sanitize pagination parameters', async () => {
      const spy = jest.spyOn(this.subject, 'performDatabaseOperations')

      await this.subject.enumerate({from: DateTime.local(), to: DateTime.local(), type: 'who', page: 12})
      expect(spy.mock.calls[0][0].text).toEqual(expect.stringContaining('LIMIT 25 OFFSET 275'))

      await this.subject.enumerate({from: DateTime.local(), to: DateTime.local(), type: 'who', pageSize: 12})
      expect(spy.mock.calls[1][0].text).toEqual(expect.stringContaining('LIMIT 12 OFFSET 0'))

      await this.subject.enumerate({from: DateTime.local(), to: DateTime.local(), type: 'who', page: 3, pageSize: 12})
      expect(spy.mock.calls[2][0].text).toEqual(expect.stringContaining('LIMIT 12 OFFSET 24'))

      await this.subject.enumerate({from: DateTime.local(), to: DateTime.local(), type: 'who', page: '12', pageSize: NaN})
      expect(spy.mock.calls[3][0].text).toEqual(expect.stringContaining('LIMIT 25 OFFSET 275'))

      await this.subject.enumerate({from: DateTime.local(), to: DateTime.local(), type: 'who', page: NaN, pageSize: 2})
      expect(spy.mock.calls[4][0].text).toEqual(expect.stringContaining('LIMIT 2 OFFSET 0'))
    })
  })

  describe('.insert', () => {
    test('should accept a single argument', async () => {
      const id = await this.subject.insert(sampleTrail())
      expect(id).toBeGreaterThan(0)
    })

    test('should raise an error when something bad happens', async () => {
      const badSubject = new TrailsManager(null, null)

      await expect(badSubject.insert(sampleTrail())).rejects.toEqual(new TypeError("Cannot read property 'connect' of null"))
    })
  })

  describe('.get', () => {
    test('should retrieve an existing trail', async () => {
      const id = await this.subject.insert(sampleTrail())

      const trail = await this.subject.get(id)
      expect(trail).toBeInstanceOf(Object)
      expect(trail).toMatchObject({
        when: DateTime.fromISO('2018-04-11T16:00:00.123', {zone: 'utc'}),
        who: {
          id: 'who',
          attributes: {}
        },
        what: {
          id: 'what',
          attributes: {
            additional: true
          }
        },
        subject: {
          id: 'subject',
          attributes: {}
        },
        where: {},
        why: {},
        meta: {}
      })
    })

    test('should return null if trail doesn\'t exist when performing a get', async () => {
      const nonExistantId = '0000'
      const trail = await this.subject.get(nonExistantId)
      expect(trail).toEqual(null)
    })

    test('should raise an error when something bad happens', async () => {
      const id = await this.subject.insert(sampleTrail())

      const badSubject = new TrailsManager(null, null)

      await expect(badSubject.get(id)).rejects.toEqual(new TypeError("Cannot read property 'connect' of null"))
    })
  })

  describe('.update', () => {
    test('should be able to update an existing trail', async () => {
      const date = DateTime.fromISO('2018-04-11T07:00:00.123-09:00', {setZone: true})
      const id = await this.subject.insert(sampleTrail())

      const res = await this.subject.update(
        id,
        {id: null, when: date, who: {id: 'who', updated: 1}, what: {id: 'what', updated: 2}, subject: {id: 'subject', updated: 3}}
      )

      expect(res).toEqual(true)

      const trail = await this.subject.get(id)
      expect(trail).toMatchObject({
        who: {
          id: 'who',
          attributes: {updated: 1}
        },
        what: {
          id: 'what',
          attributes: {updated: 2}
        },
        subject: {
          id: 'subject',
          attributes: {updated: 3}
        }
      })
    })

    test('should raise an error when something bad happens', async () => {
      const date = DateTime.fromISO('2018-04-11T07:00:00.123-09:00', {setZone: true})
      const id = await this.subject.insert(sampleTrail())

      const badSubject = new TrailsManager(null, null)

      await expect(badSubject.update(
        id,
        {id: null, when: date, who: {id: 'who', updated: 1}, what: {id: 'what', updated: 2}, subject: {id: 'subject', updated: 3}}
      ))
        .rejects.toEqual(new TypeError("Cannot read property 'connect' of null"))
    })
  })

  describe('.delete', () => {
    test('should be able to delete an existing trail', async () => {
      const id = await this.subject.insert(sampleTrail())

      const res = await this.subject.delete(id)
      expect(res).toEqual(true)
    })

    test('should return null if trail doesn\'t exist when performing a delete', async () => {
      const nonExistantId = '0000'
      const res = await this.subject.delete(nonExistantId)
      expect(res).toEqual(false)
    })

    test('should raise an error when something bad happens', async () => {
      const id = await this.subject.insert(sampleTrail())

      const badSubject = new TrailsManager(null, null)

      expect(badSubject.delete(id))
        .rejects.toEqual(new TypeError("Cannot read property 'connect' of null"))
    })
  })
})
