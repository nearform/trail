'use strict'

const {DateTime} = require('luxon')
const {errorsMessages} = require('../../lib/schemas')
const testServer = require('../test-server')

describe('Trails REST operations', () => {
  let server = null

  beforeAll(async () => {
    server = await testServer.buildDefault()
  })

  afterAll(async () => {
    await testServer.stopAll()
    await server.stop()
  })

  describe('POST /trails', async () => {
    test('it should search trails and return it with 200', async () => {
      await server.trailCore.performDatabaseOperations(client => client.query('TRUNCATE trails'))

      const id = await server.trailCore.insert({
        when: '2016-01-02T18:04:05.123+03:00',
        who: '1',
        what: '2',
        subject: '3'
      })

      const response = await server.inject({
        method: 'GET',
        url: `/trails?from=${encodeURIComponent('2014-01-02T18:04:05.123+03:00')}&to=${encodeURIComponent('2018-01-02T18:04:05.123+03:00')}`
      })

      expect(response.statusCode).toEqual(200)
      const trails = JSON.parse(response.payload)

      expect(trails[0]).toMatchObject({
        id: id,
        when: DateTime.fromISO('2016-01-02T15:04:05.123', {zone: 'utc'}).toISO(),
        who: {
          id: '1',
          attributes: {}
        },
        what: {
          id: '2',
          attributes: {}
        },
        subject: {
          id: '3',
          attributes: {}
        },
        where: {},
        why: {},
        meta: {}
      })

      await server.trailCore.delete(id)
    })

    test('it should search trails and return no body with 204 when no records are found', async () => {
      await server.trailCore.performDatabaseOperations(client => client.query('TRUNCATE trails'))

      const id = await server.trailCore.insert({
        when: '2016-01-02T18:04:05.123+03:00',
        who: '1',
        what: '2',
        subject: '3'
      })

      const response = await server.inject({
        method: 'GET',
        url: `/trails?from=${encodeURIComponent('2014-01-02T18:04:05.123+03:00')}&to=${encodeURIComponent('2018-01-02T18:04:05.123+03:00')}&who=foo`
      })

      expect(response.statusCode).toEqual(204)
      expect(response.payload).toEqual('')

      await server.trailCore.delete(id)
    })

    test('it should return 422 in case of validation errors', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/trails?from=bar&where=foo`
      })

      expect(response.statusCode).toEqual(422)
      expect(JSON.parse(response.payload)).toMatchObject({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: 'Invalid input data.',
        reasons: {
          from: 'must be a valid UTC timestamp in the format YYYY-MM-DDTHH:MM:SS.sss (example: 2018-07-06T12:34:56.123)',
          to: 'must be present and non empty',
          where: 'is not a valid attribute'
        }
      })
    })
  })

  describe('POST /trails', async () => {
    test('it should create a new trail and return it with 201', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/trails',
        payload: {
          when: '2016-01-02T18:04:05.123+03:00',
          who: 'me',
          what: {'id': 'FOO', 'abc': 'cde'},
          subject: 'FOO'
        }
      })

      expect(response.statusCode).toEqual(201)
      const trail = JSON.parse(response.payload)

      expect(trail).toMatchObject({
        when: DateTime.fromISO('2016-01-02T15:04:05.123', {zone: 'utc'}).toISO(),
        who: {
          id: 'me',
          attributes: {}
        },
        what: {
          id: 'FOO',
          attributes: {
            abc: 'cde'
          }
        },
        subject: {
          id: 'FOO',
          attributes: {}
        },
        where: {},
        why: {},
        meta: {}
      })

      await server.trailCore.delete(trail.id)
    })

    test('it should return 400 in case of invalid Content-Type header', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/trails',
        headers: {
          'Content-Type': 'text/plain'
        },
        payload: 'abc'
      })

      expect(response.statusCode).toEqual(400)
      expect(JSON.parse(response.payload)).toMatchObject({ statusCode: 400, error: 'Bad Request', message: errorsMessages['json.contentType'] })
    })

    test('it should return 400 in case of invalid JSON payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/trails',
        payload: '{"a":1'
      })

      expect(response.statusCode).toEqual(400)
      expect(JSON.parse(response.payload)).toMatchObject({ statusCode: 400, error: 'Bad Request', message: errorsMessages['json.format'] })
    })

    test('it should return 422 in case of validation errors', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/trails',
        payload: {
          when: 'invalid',
          who: 123,
          what: {},
          meta: 'FOO'
        }
      })

      expect(response.statusCode).toEqual(422)
      expect(JSON.parse(response.payload)).toMatchObject({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: 'Invalid input data.',
        reasons: {
          meta: errorsMessages['object.base'],
          subject: errorsMessages['any.required'],
          'what.id': errorsMessages['any.required'],
          when: errorsMessages['string.isoDate'],
          who: errorsMessages['custom.stringOrObject']
        }
      })
    })
  })

  describe('GET /trails/{id}', async () => {
    test('it should retrieve a existing trail and return it with 200', async () => {
      const id = await server.trailCore.insert({
        when: '2016-01-02T18:04:05.123+03:00',
        who: 'me',
        what: {'id': 'FOO', 'abc': 'cde'},
        subject: 'FOO'
      })

      const response = await server.inject({
        method: 'GET',
        url: `/trails/${id}`
      })

      expect(response.statusCode).toEqual(200)
      const trail = JSON.parse(response.payload)

      expect(trail).toMatchObject({
        when: DateTime.fromISO('2016-01-02T15:04:05.123', {zone: 'utc'}).toISO(),
        who: {
          id: 'me',
          attributes: {}
        },
        what: {
          id: 'FOO',
          attributes: {
            abc: 'cde'
          }
        },
        subject: {
          id: 'FOO',
          attributes: {}
        },
        where: {},
        why: {},
        meta: {}
      })

      await server.trailCore.delete(id)
    })

    test('it should return 404 in case of a invalid trail', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/trails/0'
      })

      expect(response.statusCode).toEqual(404)
      expect(JSON.parse(response.payload)).toMatchObject({
        statusCode: 404,
        error: 'Not Found',
        message: 'Trail with id 0 not found.'
      })
    })

    test('it should return 500 in case of internal errors', async () => {
      const anotherServer = await testServer.build()

      const spy = jest.spyOn(anotherServer.trailCore, 'get').mockImplementation(async () => {
        throw new Error('FOO')
      })

      const response = await anotherServer.inject({
        method: 'GET',
        url: '/trails/123'
      })

      expect(response.statusCode).toEqual(500)

      expect(JSON.parse(response.payload)).toMatchObject({
        statusCode: 500,
        error: 'Internal Server Error',
        message: '[Error] FOO',
        stack: expect.any(Array)
      })

      spy.mockRestore()
    })
  })

  describe('PUT /trails/{id}', async () => {
    test('it should update a existing trail and return it with 202', async () => {
      const id = await server.trailCore.insert({
        when: '2016-01-02T18:04:05.123+03:00',
        who: '1',
        what: '2',
        subject: '3'
      })

      expect((await server.trailCore.get(id)).who).toMatchObject({id: '1'})

      const response = await server.inject({
        method: 'PUT',
        url: `/trails/${id}`,
        payload: {
          when: '2016-01-02T18:04:05.123+03:00',
          who: 'me',
          what: {'id': 'FOO', 'abc': 'cde'},
          subject: 'FOO'
        }
      })

      expect(response.statusCode).toEqual(202)
      const trail = JSON.parse(response.payload)

      expect(trail).toMatchObject({
        when: DateTime.fromISO('2016-01-02T15:04:05.123', {zone: 'utc'}).toISO(),
        who: {
          id: 'me',
          attributes: {}
        },
        what: {
          id: 'FOO',
          attributes: {
            abc: 'cde'
          }
        },
        subject: {
          id: 'FOO',
          attributes: {}
        },
        where: {},
        why: {},
        meta: {}
      })

      expect((await server.trailCore.get(id)).who).toMatchObject({id: 'me'})

      await server.trailCore.delete(id)
    })

    test('it should return 404 in case of a invalid trail', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/trails/0',
        payload: {
          when: '2016-01-02T18:04:05.123+03:00',
          who: 'me',
          what: {'id': 'FOO', 'abc': 'cde'},
          subject: 'FOO'
        }
      })

      expect(response.statusCode).toEqual(404)
      expect(JSON.parse(response.payload)).toMatchObject({
        statusCode: 404,
        error: 'Not Found',
        message: 'Trail with id 0 not found.'
      })
    })
  })

  describe('DELETE /trails/{id}', async () => {
    test('it should delete a existing trail and acknowledge with 204', async () => {
      const id = await server.trailCore.insert({
        when: '2016-01-02T18:04:05.123+03:00',
        who: '1',
        what: '2',
        subject: '3'
      })

      expect(await server.trailCore.get(id)).toEqual(expect.anything())

      const response = await server.inject({
        method: 'DELETE',
        url: `/trails/${id}`
      })

      expect(response.statusCode).toEqual(204)
      expect(response.payload).toEqual('')

      expect(await server.trailCore.get(id)).not.toEqual(expect.anything())

      await server.trailCore.delete(id)
    })

    test('it should return 404 in case of a invalid trail', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/trails/0'
      })

      expect(response.statusCode).toEqual(404)
      expect(JSON.parse(response.payload)).toMatchObject({
        statusCode: 404,
        error: 'Not Found',
        message: 'Trail with id 0 not found.'
      })
    })
  })
})
