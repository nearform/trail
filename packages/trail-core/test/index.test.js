'use strict'

const { expect } = require('code')
const Lab = require('lab')
const sinon = require('sinon')

module.exports.lab = Lab.script()
const { describe, it: test, before, after } = module.exports.lab

const SQL = require('@nearform/sql')
const {DateTime} = require('luxon')

const {TrailsManager} = require('../lib')

const sampleTrail = function () {
  const date = DateTime.fromISO('2018-04-11T07:00:00.123-09:00', {setZone: true})
  return {id: null, when: date, who: 'who', what: {id: 'what', additional: true}, subject: 'subject'}
}

describe('TrailsManager', () => {
  before(() => {
    this.subject = new TrailsManager()
  })

  after(async () => {
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
        expect(e.message).to.equal('rollback please')
      }

      const newCount = parseInt((await this.subject.performDatabaseOperations(client => client.query('SELECT COUNT(*) FROM trails'), false)).rows[0].count, 0)
      expect(newCount).to.equal(count)
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
        expect(e.message).to.equal('rollback please')
      }

      const newCount = parseInt((await this.subject.performDatabaseOperations(client => client.query('SELECT COUNT(*) FROM trails'), false)).rows[0].count, 0)

      expect(newCount).to.equal(count + 1)
    })

    test('should raise an error when db pool is empty', async () => {
      const badSubject = new TrailsManager('logger', null)

      await expect(badSubject.performDatabaseOperations(client => client.query('TRUNCATE trails'))).to.reject(Error, 'Cannot read property \'connect\' of null')
    })
  })

  describe('.close', () => {
    test('should raise an error when something bad happens', async () => {
      const badSubject = new TrailsManager(null, null)

      await expect(badSubject.close()).to.reject(TypeError, "Cannot read property 'end' of null")
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
        .map(r => r.id)).to.equal([ids[0], ids[1]])

      expect((await this.subject.search({from: '2018-01-01T15:00:00+00:00', to: '2018-01-04T13:34:56+00:00', what: 'evening', sort: 'id'}))
        .map(r => r.id)).to.equal([ids[1], ids[3]].sort())

      expect((await this.subject.search({from: '2018-01-01T15:00:00+00:00', to: '2018-01-04T13:34:56+00:00', what: 'evening', sort: '-subject'}))
        .map(r => r.id)).to.equal([ids[1], ids[3]])

      expect((await this.subject.search({from: '2018-01-01T15:00:00+00:00', to: '2018-01-05T13:34:56+00:00', subject: 'world'}))
        .map(r => r.id)).to.equal([ids[4]])

      expect((await this.subject.search({from: '2018-01-01T15:00:00+00:00', to: '2018-01-05T13:34:56+00:00', what: 'world'}))
        .map(r => r.id)).to.equal([])

      expect((await this.subject.search({from: '2018-01-01T00:00:00+00:00', to: '2018-01-05T13:34:56+00:00', sort: 'when', page: 2, pageSize: 2}))
        .map(r => r.id)).to.equal([ids[2], ids[3]])

      await Promise.all(ids.map(i => this.subject.delete(i)))
    })

    test('should return the records with exact match', async () => {
      await this.subject.performDatabaseOperations(client => client.query('TRUNCATE trails'))

      const records = [
        {when: '2018-01-01T12:34:56+00:00', who: 'dog cat fish', what: 'open morning', subject: 'window'},
        {when: '2018-01-02T12:34:56+00:00', who: 'dog cat shark', what: 'evening', subject: 'window'},
        {when: '2018-01-03T12:34:56+00:00', who: 'wolf cat whale', what: 'open morning', subject: 'door'},
        {when: '2018-01-04T12:34:56+00:00', who: 'hyena lion fish', what: 'evening', subject: 'door'},
        {when: '2018-01-05T12:34:56+00:00', who: 'hyena tiger whal', what: 'close night', subject: 'world'}
      ]

      const ids = await Promise.all(records.map(r => this.subject.insert(r)))

      expect((await this.subject.search({from: '2018-01-01T11:00:00+00:00', to: '2018-01-04T13:34:56+00:00', who: 'dog cat fish', sort: 'when', exactMatch: true}))
        .map(r => r.id)).to.equal([ids[0]])

      expect((await this.subject.search({from: '2018-01-01T15:00:00+00:00', to: '2018-01-04T13:34:56+00:00', what: 'evening', sort: 'when', exactMatch: true}))
        .map(r => r.id)).to.equal([ids[1], ids[3]])

      expect((await this.subject.search({from: '2018-01-01T15:00:00+00:00', to: '2018-01-05T13:34:56+00:00', subject: 'door', sort: 'when', exactMatch: true}))
        .map(r => r.id)).to.equal([ids[2], ids[3]])

      await Promise.all(ids.map(i => this.subject.delete(i)))
    })

    test('should validate parameters', async () => {
      await expect(this.subject.search()).to.reject(Error, 'You must specify a starting date ("from" attribute) when querying trails.')
      await expect(this.subject.search({from: DateTime.local()}))
        .to.reject(Error, 'You must specify a ending date ("to" attribute) when querying trails.')

      await expect(this.subject.search({from: 'whatever', to: DateTime.local()}))
        .to.reject(Error, 'Invalid date "whatever". Please specify a valid UTC date in ISO8601 format.')
      await expect(this.subject.search({from: DateTime.local(), to: DateTime.local(), who: 1}))
        .to.reject(Error, 'Only strings are supporting for searching in the id of the "who" field.')
      await expect(this.subject.search({from: DateTime.local(), to: DateTime.local(), what: 1}))
        .to.reject(Error, 'Only strings are supporting for searching in the id of the "what" field.')
      await expect(this.subject.search({from: DateTime.local(), to: DateTime.local(), subject: 1}))
        .to.reject(Error, 'Only strings are supporting for searching in the id of the "subject" field.')
      await expect(this.subject.search({from: DateTime.local(), to: DateTime.local(), sort: '-metadata'}))
        .to.reject(Error, 'Only "id", "when", "who", "what" and "subject" are supported for sorting.')
    })

    test('should return the records with case insensitiveness', async () => {
      await this.subject.performDatabaseOperations(client => client.query('TRUNCATE trails'))

      const records = [
        {when: '2018-01-01T12:34:56+00:00', who: 'dog cat fish', what: 'open MORNing', subject: 'window'},
        {when: '2018-01-02T12:34:56+00:00', who: 'dog cat shark', what: 'evening', subject: 'window'},
        {when: '2018-01-03T12:34:56+00:00', who: 'wolf cat whale', what: 'open morning', subject: 'door'},
        {when: '2018-01-04T12:34:56+00:00', who: 'hyena lion fish', what: 'evening', subject: 'DOOr'},
        {when: '2018-01-05T12:34:56+00:00', who: 'hyena tiger whal', what: 'close night', subject: 'world'}
      ]

      const ids = await Promise.all(records.map(r => this.subject.insert(r)))

      expect((await this.subject.search({from: '2018-01-01T15:00:00+00:00', to: '2018-01-04T13:34:56+00:00', subject: 'DOOr', sort: 'when', exactMatch: true, caseInsensitive: true}))
        .map(r => r.id)).to.equal([ids[2], ids[3]])

      expect((await this.subject.search({from: '2018-01-01T15:00:00+00:00', to: '2018-01-04T13:34:56+00:00', subject: 'DOOr', sort: 'when', exactMatch: true}))
        .map(r => r.id)).to.equal([ids[3]])

      expect((await this.subject.search({from: '2018-01-01T12:00:00+00:00', to: '2018-01-05T13:34:56+00:00', what: 'MORNing', sort: 'when', caseInsensitive: true}))
        .map(r => r.id)).to.equal([ids[0], ids[2]])

      expect((await this.subject.search({from: '2018-01-01T12:00:00+00:00', to: '2018-01-05T13:34:56+00:00', what: 'MORNing', sort: 'when'}))
        .map(r => r.id)).to.equal([ids[0]])

      await Promise.all(ids.map(i => this.subject.delete(i)))
    })

    test('should sanitize pagination parameters', async () => {
      const spy = sinon.spy(this.subject, 'performDatabaseOperations')

      await this.subject.search({from: DateTime.local(), to: DateTime.local(), page: 12})
      expect(spy.getCall(0).args[0].text).to.include('LIMIT 25 OFFSET 275')

      await this.subject.search({from: DateTime.local(), to: DateTime.local(), pageSize: 12})
      expect(spy.getCall(1).args[0].text).to.include('LIMIT 12 OFFSET 0')

      await this.subject.search({from: DateTime.local(), to: DateTime.local(), page: 3, pageSize: 12})
      expect(spy.getCall(2).args[0].text).to.include('LIMIT 12 OFFSET 24')

      await this.subject.search({from: DateTime.local(), to: DateTime.local(), page: '12', pageSize: NaN})
      expect(spy.getCall(3).args[0].text).to.include('LIMIT 25 OFFSET 275')

      await this.subject.search({from: DateTime.local(), to: DateTime.local(), page: NaN, pageSize: 2})
      expect(spy.getCall(4).args[0].text).to.include('LIMIT 2 OFFSET 0')

      spy.restore()
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
        .to.equal(['cat', 'dog', 'whale'])

      expect((await this.subject.enumerate({from: '2018-01-01T15:00:00+00:00', to: '2018-01-04T13:34:56+00:00', type: 'what'})))
        .to.equal(['close', 'open'])

      expect((await this.subject.enumerate({from: '2018-01-01T11:00:00+00:00', to: '2018-01-04T13:34:56+00:00', type: 'who', desc: true})))
        .to.equal(['whale', 'dog', 'cat'])

      expect((await this.subject.enumerate({from: '2018-01-01T15:00:00+00:00', to: '2018-01-05T13:34:56+00:00', type: 'who'})))
        .to.equal(['cat', 'shark', 'whale'])

      expect((await this.subject.enumerate({from: '2018-01-01T15:00:00+00:00', to: '2018-01-05T13:34:56+00:00', type: 'what'})))
        .to.equal(['check', 'close', 'open'])

      expect((await this.subject.enumerate({from: '2018-01-01T00:00:00+00:00', to: '2018-01-05T13:34:56+00:00', type: 'who', page: 2, pageSize: 1})))
        .to.equal(['dog'])

      expect((await this.subject.enumerate({from: '2018-02-01T11:00:00+00:00', to: '2018-02-04T13:34:56+00:00', type: 'who'}))).to.equal([])

      await Promise.all(ids.map(i => this.subject.delete(i)))
    })

    test('should validate parameters', async () => {
      await expect(this.subject.enumerate()).to.reject(Error, 'You must specify a starting date ("from" attribute) when enumerating.')
      await expect(this.subject.enumerate({from: DateTime.local()}))
        .to.reject(Error, 'You must specify a ending date ("to" attribute) when enumerating.')

      await expect(this.subject.enumerate({from: 'whatever', to: DateTime.local()}))
        .to.reject(Error, 'Invalid date "whatever". Please specify a valid UTC date in ISO8601 format.')
      await expect(this.subject.enumerate({from: DateTime.local(), to: DateTime.local(), type: 'foo'}))
        .to.reject(Error, 'You must select between "who", "what" or "subject" type ("type" attribute) when enumerating.')
    })

    test('should sanitize pagination parameters', async () => {
      const spy = sinon.spy(this.subject, 'performDatabaseOperations')

      await this.subject.enumerate({from: DateTime.local(), to: DateTime.local(), type: 'who', page: 12})
      expect(spy.getCall(0).args[0].text).to.include('LIMIT 25 OFFSET 275')

      await this.subject.enumerate({from: DateTime.local(), to: DateTime.local(), type: 'who', pageSize: 12})
      expect(spy.getCall(1).args[0].text).to.include('LIMIT 12 OFFSET 0')

      await this.subject.enumerate({from: DateTime.local(), to: DateTime.local(), type: 'who', page: 3, pageSize: 12})
      expect(spy.getCall(2).args[0].text).to.include('LIMIT 12 OFFSET 24')

      await this.subject.enumerate({from: DateTime.local(), to: DateTime.local(), type: 'who', page: '12', pageSize: NaN})
      expect(spy.getCall(3).args[0].text).to.include('LIMIT 25 OFFSET 275')

      await this.subject.enumerate({from: DateTime.local(), to: DateTime.local(), type: 'who', page: NaN, pageSize: 2})
      expect(spy.getCall(4).args[0].text).to.include('LIMIT 2 OFFSET 0')

      spy.restore()
    })
  })

  describe('.insert', () => {
    test('should accept a single argument', async () => {
      const id = await this.subject.insert(sampleTrail())
      expect(id).to.be.least(0)
    })

    test('should raise an error when something bad happens', async () => {
      const badSubject = new TrailsManager(null, null)

      await expect(badSubject.insert(sampleTrail())).to.reject(TypeError, "Cannot read property 'connect' of null")
    })
  })

  describe('.get', () => {
    test('should retrieve an existing trail', async () => {
      const id = await this.subject.insert(sampleTrail())

      const trail = await this.subject.get(id)
      expect(trail).to.be.object()
      expect(trail).to.include({
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
      expect(trail).to.equal(null)
    })

    test('should raise an error when something bad happens', async () => {
      const id = await this.subject.insert(sampleTrail())

      const badSubject = new TrailsManager(null, null)

      await expect(badSubject.get(id)).to.reject(TypeError, "Cannot read property 'connect' of null")
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

      expect(res).to.equal(true)

      const trail = await this.subject.get(id)
      expect(trail).include({
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
        .to.reject(TypeError, "Cannot read property 'connect' of null")
    })
  })

  describe('.delete', () => {
    test('should be able to delete an existing trail', async () => {
      const id = await this.subject.insert(sampleTrail())

      const res = await this.subject.delete(id)
      expect(res).to.equal(true)
    })

    test('should return null if trail doesn\'t exist when performing a delete', async () => {
      const nonExistantId = '0000'
      const res = await this.subject.delete(nonExistantId)
      expect(res).to.equal(false)
    })

    test('should raise an error when something bad happens', async () => {
      const id = await this.subject.insert(sampleTrail())

      const badSubject = new TrailsManager(null, null)

      expect(badSubject.delete(id))
        .to.reject(TypeError, "Cannot read property 'connect' of null")
    })
  })
})
