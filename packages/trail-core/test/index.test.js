const {DateTime} = require('luxon')
require('./utils')

const {TrailsManager, Trail, TrailComponent} = require('../lib')

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

describe('TrailsManager', () => {
  beforeAll(() => {
    this.subject = new TrailsManager()
  })

  afterAll(async () => {
    this.subject.performDatabaseOperations(client => client.query('TRUNCATE trails'))
  })

  test('should create a new trail', async () => {
    const date = DateTime.fromISO('2018-04-11T07:00:00.123-09:00', {setZone: true})

    const id = await this.subject.insert(date, 'who', {id: 'what', additional: true}, 'subject')
    expect(id).toBeGreaterThan(0)
  })

  test('should raise an error when db pool is empty', async () => {
    const badSubject = new TrailsManager()
    badSubject.dbPool = null;
    expect(badSubject.performDatabaseOperations(client => client.query('TRUNCATE trails'))).rejects.toEqual(new Error('Cannot read property \'connect\' of null'))
  })

  test('should raise an error when db pool is empty', async () => {
    const badSubject = new TrailsManager()
    const date = DateTime.fromISO('2018-04-11T07:00:00.123-09:00', {setZone: true})
    const id = await this.subject.insert(date, 'who', {id: 'what', additional: true}, 'subject')

    badSubject.dbPool = null;
    expect(badSubject.get(id)).rejects.toEqual(new Error('Cannot read property \'connect\' of null'))
  })

  test('should retrieve an existing trail', async () => {
    const date = DateTime.fromISO('2018-04-11T07:00:00.123-09:00', {setZone: true})
    const id = await this.subject.insert(date, 'who', {id: 'what', additional: true}, 'subject')

    const trail = await this.subject.get(id)
    expect(trail).toBeInstanceOf(Trail)
    expect(trail.who).toBeInstanceOf(TrailComponent)
    expect(trail).toMatchObject({
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
      }
    })
  })

  test('should return null if trail doesn\'t exist when performing a get', async () => {
    const nonExistantId = '0000'
    const trail = await this.subject.get(nonExistantId)
    expect(trail).toEqual(null)
  })

  test('should be able to delete an existing trail', async () => {
    const date = DateTime.fromISO('2018-04-11T07:00:00.123-09:00', {setZone: true})
    const id = await this.subject.insert(date, 'who', {id: 'what', additional: true}, 'subject')

    const {rowCount} = await this.subject.delete(id)
    expect(rowCount).toEqual(1)
  })

  test('should return null if trail doesn\'t exist when performing a delete', async () => {
    const nonExistantId = '0000'
    const res = await this.subject.delete(nonExistantId)
    expect(res).toEqual(null)
  })

  test('should be able to update an existing trail', async () => {
    const date = DateTime.fromISO('2018-04-11T07:00:00.123-09:00', {setZone: true})
    const id = await this.subject.insert(date, 'who', {id: 'what', additional: true}, 'subject')

    const {rowCount} = await this.subject.update(id,
      {attributes: {updated: true}},
      {attributes: {updated: true}},
      {attributes: {updated: true}},
      {attributes: {updated: true}},
      {attributes: {updated: true}}
    )

    expect(rowCount).toEqual(1)

    const trail = await this.subject.get(id)
    expect(trail).toMatchObject({
      who: {
        id: 'who',
        attributes: {updated: true}
      },
      what: {
        id: 'what',
        attributes: {updated: true}
      },
      subject: {
        id: 'subject',
        attributes: {updated: true}
      }
    })
  })
})
