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
              INTO trails ("when", who_id, what_id, subject_id, who_data, what_data, subject_data, where_data, why_data, meta)
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
              INTO trails ("when", who_id, what_id, subject_id, who_data, what_data, subject_data, where_data, why_data, meta)
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
