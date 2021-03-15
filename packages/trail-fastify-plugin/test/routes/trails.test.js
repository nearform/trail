'use strict'

const { expect } = require('code')
const Lab = require('@hapi/lab')
const sinon = require('sinon')

module.exports.lab = Lab.script()
const { describe, it: test, before, after } = module.exports.lab

const { DateTime } = require('luxon')
const { errorsMessages } = require('../../lib/schemas/errors')
const testServer = require('../test-server')

describe('Trails REST operations', () => {
  let server = null

  before(async () => {
    server = await testServer.buildDefault()
  })

  after(async () => {
    return testServer.stopAll()
  })

  describe('JSON spec', () => {
    for (const url of ['/trails/openapi.json', '/trails/swagger.json']) {
      test(`GET ${url} it should server the API spec file`, async () => {
        const response = await server.inject({
          method: 'GET',
          url
        })

        expect(response.statusCode).to.equal(200)
        const payload = JSON.parse(response.payload)

        expect(payload).include({
          openapi: '3.0.1'
        })
      })
    }
  })

  describe('GET /trails', async () => {
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

      expect(response.statusCode).to.equal(200)
      const trails = JSON.parse(response.payload)

      expect(trails.count).to.equal(1)
      expect(trails.data[0]).to.include({
        id: id,
        when: DateTime.fromISO('2016-01-02T15:04:05.123', { zone: 'utc' }).toISO(),
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

    test('it should search trails, include data for where,why,meta fields and return it with 200', async () => {
      await server.trailCore.performDatabaseOperations(client => client.query('TRUNCATE trails'))

      const id = await server.trailCore.insert({
        when: '2021-03-01T18:04:05.123+03:00',
        who: '1',
        what: '2',
        subject: '3',
        where: { ip: 'localhost' },
        why: { ticket: '4' },
        meta: { result: 'success' }
      })

      const response = await server.inject({
        method: 'GET',
        url: `/trails?from=${encodeURIComponent('2021-03-01T18:04:05.123+03:00')}&to=${encodeURIComponent('2021-03-01T18:04:05.123+03:00')}`
      })

      expect(response.statusCode).to.equal(200)
      const trails = JSON.parse(response.payload)

      expect(trails.count).to.equal(1)
      expect(trails.data[0]).to.include({
        id: id,
        when: DateTime.fromISO('2021-03-01T15:04:05.123', { zone: 'utc' }).toISO(),
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
        where: { ip: 'localhost' },
        why: { ticket: '4' },
        meta: { result: 'success' }
      })

      await server.trailCore.delete(id)
    })

    test('it should search trails and return a empty array when no records are found', async () => {
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

      expect(response.statusCode).to.equal(200)
      const trails = JSON.parse(response.payload)

      expect(trails.count).to.equal(0)
      expect(trails.data).to.equal([])

      await server.trailCore.delete(id)
    })

    test('it should return 422 in case of validation errors', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/trails?from=bar&where=foo'
      })

      expect(response.statusCode).to.equal(422)
      expect(JSON.parse(response.payload)).to.include({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: 'Invalid input data.',
        reasons: {
          from: 'must be a valid UTC timestamp in the format YYYY-MM-DDTHH:MM:SS.sss (example: 2018-07-06T12:34:56.123)'
        }
      })
    })
  })

  describe('GET /trails/enumerate', async () => {
    test('it should enumerate trails and return it with 200', async () => {
      await server.trailCore.performDatabaseOperations(client => client.query('TRUNCATE trails'))

      const id = await server.trailCore.insert({
        when: '2016-01-02T18:04:05.123+03:00',
        who: '1',
        what: '2',
        subject: '3'
      })

      const response = await server.inject({
        method: 'GET',
        url: `/trails/enumerate?from=${encodeURIComponent('2014-01-02T18:04:05.123+03:00')}&to=${encodeURIComponent('2018-01-02T18:04:05.123+03:00')}&type=who`
      })

      expect(response.statusCode).to.equal(200)
      const enumeration = JSON.parse(response.payload)

      expect(enumeration).to.equal(['1'])

      await server.trailCore.delete(id)
    })

    test('it should enumerate trails and return a empty array when no records are found', async () => {
      await server.trailCore.performDatabaseOperations(client => client.query('TRUNCATE trails'))

      const id = await server.trailCore.insert({
        when: '2016-01-02T18:04:05.123+03:00',
        who: '1',
        what: '2',
        subject: '3'
      })

      const response = await server.inject({
        method: 'GET',
        url: `/trails/enumerate?from=${encodeURIComponent('2014-01-02T18:04:05.123+03:00')}&to=${encodeURIComponent('2015-01-02T18:04:05.123+03:00')}&type=who`
      })

      expect(response.statusCode).to.equal(200)
      const enumeration = JSON.parse(response.payload)

      expect(enumeration).to.equal([])

      await server.trailCore.delete(id)
    })

    test('it should return 422 in case of validation errors', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/trails/enumerate?from=bar'
      })

      expect(response.statusCode).to.equal(422)
      expect(JSON.parse(response.payload)).to.equal({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: 'Invalid input data.',
        reasons: {
          from: 'must be a valid UTC timestamp in the format YYYY-MM-DDTHH:MM:SS.sss (example: 2018-07-06T12:34:56.123)'
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
          what: { id: 'FOO', abc: 'cde' },
          subject: 'FOO'
        }
      })

      expect(response.statusCode).to.equal(201)
      const trail = JSON.parse(response.payload)

      expect(trail).to.include({
        when: DateTime.fromISO('2016-01-02T15:04:05.123', { zone: 'utc' }).toISO(),
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

    /* Fastify appears to parse the content before validating errors, so not possible to reproduce this unit test as-is.
    test('it should return 400 in case of invalid Content-Type header', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/trails',
        headers: {
          'Content-Type': 'text/plain'
        },
        payload: 'abc'
      })

      expect(response.statusCode).to.equal(400)
      expect(JSON.parse(response.payload)).to.include({ statusCode: 400, error: 'Bad Request', message: errorsMessages['json.contentType'] })
    })
    */

    test('it should return 400 in case of invalid JSON payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/trails',
        headers: {
          'Content-Type': 'application/json'
        },
        payload: '{"a":1'
      })

      expect(response.statusCode).to.equal(400)
      expect(JSON.parse(response.payload)).to.include({ statusCode: 400, error: 'Bad Request', message: errorsMessages['json.format'] })
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

      expect(response.statusCode).to.equal(422)
      expect(JSON.parse(response.payload)).to.include({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: 'Invalid input data.',
        reasons: {
          when: errorsMessages['string.isoDate']
        }
      })
    })
  })

  describe('GET /trails/{id}', async () => {
    test('it should retrieve a existing trail and return it with 200', async () => {
      const id = await server.trailCore.insert({
        when: '2016-01-02T18:04:05.123+03:00',
        who: 'me',
        what: { id: 'FOO', abc: 'cde' },
        subject: 'FOO'
      })

      const response = await server.inject({
        method: 'GET',
        url: `/trails/${id}`
      })

      expect(response.statusCode).to.equal(200)
      const trail = JSON.parse(response.payload)

      expect(trail).to.include({
        when: DateTime.fromISO('2016-01-02T15:04:05.123', { zone: 'utc' }).toISO(),
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

    test('it should retrieve a existing trail with all the field values and return it with 200', async () => {
      const id = await server.trailCore.insert({
        when: '2016-03-01T18:04:05.123+03:00',
        who: 'me',
        what: { id: 'FOO', abc: 'cde' },
        subject: 'FOO',
        where: { ip: 'localhost' },
        why: { ticket: '4' },
        meta: { result: 'success' }
      })

      const response = await server.inject({
        method: 'GET',
        url: `/trails/${id}`
      })

      expect(response.statusCode).to.equal(200)
      const trail = JSON.parse(response.payload)

      expect(trail).to.include({
        when: DateTime.fromISO('2016-03-01T15:04:05.123', { zone: 'utc' }).toISO(),
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
        where: { ip: 'localhost' },
        why: { ticket: '4' },
        meta: { result: 'success' }
      })

      await server.trailCore.delete(id)
    })

    test('it should return 404 in case of a invalid trail', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/trails/0'
      })

      expect(response.statusCode).to.equal(404)
      expect(JSON.parse(response.payload)).to.include({
        statusCode: 404,
        error: 'Not Found',
        message: 'Trail with id 0 not found.'
      })
    })

    test('it should return 500 in case of internal errors', async () => {
      const anotherServer = await testServer.build()

      const spy = sinon.stub(anotherServer.trailCore, 'get').rejects(new Error('FOO'))

      const response = await anotherServer.inject({
        method: 'GET',
        url: '/trails/123'
      })

      expect(response.statusCode).to.equal(500)

      const parsed = JSON.parse(response.payload)
      expect(parsed).to.include({
        statusCode: 500,
        error: 'Internal Server Error',
        message: '[Error] FOO'
      })

      expect(parsed.stack).to.be.array()

      spy.restore()
    })

    test('it should return 500 with error code in case of internal errors', async () => {
      const anotherServer = await testServer.build()

      const error = new Error('FOO')
      error.code = 'CODE'

      const spy = sinon.stub(anotherServer.trailCore, 'get').rejects(error)

      const response = await anotherServer.inject({
        method: 'GET',
        url: '/trails/123'
      })

      expect(response.statusCode).to.equal(500)

      const parsed = JSON.parse(response.payload)
      expect(parsed).to.include({
        statusCode: 500,
        error: 'Internal Server Error',
        message: '[CODE] FOO'
      })

      expect(parsed.stack).to.be.array()

      spy.restore()
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

      expect((await server.trailCore.get(id)).who).to.include({ id: '1' })

      const response = await server.inject({
        method: 'PUT',
        url: `/trails/${id}`,
        payload: {
          when: '2016-01-02T18:04:05.123+03:00',
          who: 'me',
          what: { id: 'FOO', abc: 'cde' },
          subject: 'FOO'
        }
      })

      expect(response.statusCode).to.equal(202)
      const trail = JSON.parse(response.payload)

      expect(trail).to.include({
        when: DateTime.fromISO('2016-01-02T15:04:05.123', { zone: 'utc' }).toISO(),
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

      expect((await server.trailCore.get(id)).who).to.include({ id: 'me' })

      await server.trailCore.delete(id)
    })

    test('it should return 404 in case of a invalid trail', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/trails/0',
        payload: {
          when: '2016-01-02T18:04:05.123+03:00',
          who: 'me',
          what: { id: 'FOO', abc: 'cde' },
          subject: 'FOO'
        }
      })

      expect(response.statusCode).to.equal(404)
      expect(JSON.parse(response.payload)).to.include({
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

      expect(await server.trailCore.get(id)).to.be.object()

      const response = await server.inject({
        method: 'DELETE',
        url: `/trails/${id}`
      })

      expect(response.statusCode).to.equal(204)
      expect(response.payload).to.equal('')

      expect(await server.trailCore.get(id)).to.be.null()

      await server.trailCore.delete(id)
    })

    test('it should return 404 in case of a invalid trail', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/trails/0'
      })

      expect(response.statusCode).to.equal(404)
      expect(JSON.parse(response.payload)).to.include({
        statusCode: 404,
        error: 'Not Found',
        message: 'Trail with id 0 not found.'
      })
    })
  })
})
