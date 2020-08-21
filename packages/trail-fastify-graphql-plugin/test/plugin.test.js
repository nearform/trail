'use strict'

const { expect } = require('@hapi/code')
const Lab = require('@hapi/lab')

module.exports.lab = Lab.script()
const { describe, it: test, before, after } = module.exports.lab

const { DateTime } = require('luxon')
const testServer = require('./test-server')

const encodeQuery = q => encodeURIComponent(q.replace(/\s+/g, ' '))

describe('Trails graphql HTTP operations', () => {
  let server = null

  before(async () => {
    server = await testServer.buildDefault()
  })

  after(async () => {
    return testServer.stopAll()
  })

  describe('GET /graphql - query data', async () => {
    test('query trails and return with 200', async () => {
      await server.trailCore.performDatabaseOperations(client => client.query('TRUNCATE trails'))

      const id = await server.trailCore.insert({
        when: '2016-01-02T18:04:05.123+03:00',
        who: '1',
        what: '2',
        subject: '3'
      })

      const query = encodeQuery(`{
        trails(
          from: "2014-01-02T18:04:05.123+03:00"
          to: "2018-01-02T18:04:05.123+03:00"
        ) {
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

      const response = await server.inject({
        method: 'GET',
        url: `/graphql?query=${query}`
      })

      expect(response.statusCode).to.equal(200)
      const { data: { trails } } = JSON.parse(response.payload)

      expect(trails[0]).to.include({
        id: id,
        when: DateTime.fromISO('2016-01-02T15:04:05.123Z', { zone: 'utc' }).toISO(),
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

    test('return 400 in case of malformed query', async () => {
      const query = encodeQuery(`{
        trails(
          from: "2014-01-02T18:04:05.123+03:00"
          to: "2018-01-02T18:04:05.123+03:00"
        ) {
          id
          when
          who`)

      const response = await server.inject({
        method: 'GET',
        url: `/graphql?query=${query}`
      })

      expect(response.statusCode).to.equal(400)
      expect(JSON.parse(response.payload)).to.include({
        errors: [
          {
            message: 'Syntax Error: Expected Name, found <EOF>',
            locations: [{ line: 1, column: 100 }]
          }
        ],
        data: null
      })
    })

    test('return 400 in case of invalid query', async () => {
      const query = encodeQuery(`{
        otherthings(
          from: "2014-01-02T18:04:05.123+03:00"
          to: "2018-01-02T18:04:05.123+03:00"
        ) {
          id
          when
          who
        }`)

      const response = await server.inject({
        method: 'GET',
        url: `/graphql?query=${query}`
      })

      expect(response.statusCode).to.equal(400)
      expect(JSON.parse(response.payload)).to.include({
        errors: [
          {
            message: 'Syntax Error: Expected Name, found <EOF>',
            locations: [{ line: 1, column: 107 }]
          }
        ],
        data: null
      })
    })
  })

  describe('POST /graphql - insert mutations', async () => {
    test('create new trail from graphql payload and return with 201', async () => {
      const when = '2016-01-02T15:04:05.123Z'
      const who = 'me'
      const what = 'FOO'
      const subject = 'FOO'

      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'Content-Type': 'application/graphql'
        },
        payload: `mutation {
          trail: insertTrail(when: "${when}", who: "${who}", what: "${what}", subject: "${subject}") {
            id
            when
            who
            what
            subject
            where
            why
            meta
          }
        }`
      })

      expect(response.statusCode).to.equal(200)
      const { data: { trail } } = JSON.parse(response.payload)

      expect(trail).to.include({
        when: DateTime.fromISO(when, { zone: 'utc' }).toISO(),
        who: {
          id: who,
          attributes: {}
        },
        what: {
          id: what,
          attributes: {}
        },
        subject: {
          id: subject,
          attributes: {}
        },
        where: {},
        why: {},
        meta: {}
      })

      await server.trailCore.delete(trail.id)
    })

    test('create new trail from json payload with variables and return with 200', async () => {
      const when = '2016-01-02T15:04:05.123Z'
      const who = 'me'
      const what = 'FOO'
      const subject = 'FOO'

      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify({
          query: `mutation insertTrail($when: Date!, $who: StringWithAttrs!, $what: StringWithAttrs!, $subject: StringWithAttrs!) {
            trail: insertTrail(when: $when, who: $who, what: $what, subject: $subject) {
               id
               when
               who
               what
               subject
               where
               why
               meta
             }
           }`,
          variables: { when, who, what, subject }
        })
      })

      expect(response.statusCode).to.equal(200)

      const { data: { trail } } = JSON.parse(response.payload)

      expect(trail).to.include({
        when: DateTime.fromISO(when, { zone: 'utc' }).toISO(),
        who: {
          id: who,
          attributes: {}
        },
        what: {
          id: what,
          attributes: {}
        },
        subject: {
          id: subject,
          attributes: {}
        },
        where: {},
        why: {},
        meta: {}
      })

      await server.trailCore.delete(trail.id)
    })

    test('update trail with JSON variable and return with 200', async () => {
      await server.trailCore.performDatabaseOperations(client => client.query('TRUNCATE trails'))

      const id = await server.trailCore.insert({
        when: '2016-01-02T18:04:05.123+03:00',
        who: 'who',
        what: 'what',
        subject: 'subject'
      })

      const meta = { tags: ['foo', 'bar'] }

      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify({
          query: `mutation updateTrail($id: Int!, $meta: JSON) {
            trail: updateTrail(id: $id, meta: $meta) {
               id
               meta
             }
           }`,
          variables: { id, meta }
        })
      })

      expect(response.statusCode).to.equal(200)

      const { data: { trail } } = JSON.parse(response.payload)

      expect(trail).to.include({ id, meta })

      await server.trailCore.delete(trail.id)
    })

    test('return 400 in case of invalid JSON payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'Content-Type': 'application/json'
        },
        payload: '{"a":1'
      })

      expect(response.statusCode).to.equal(400)
      expect(JSON.parse(response.payload)).to.include({ errors: [{ message: 'Unexpected end of JSON input' }], data: null })
    })
  })
})

describe('Trails graphql HTTP operations with prefix path', () => {
  let server = null
  const prefix = '/prefix'

  before(async () => {
    server = await testServer.build({ prefix })
  })

  after(async () => {
    return testServer.stopAll()
  })

  describe(`GET ${prefix}/graphql - query data`, async () => {
    test('query trails and return with 200', async () => {
      await server.trailCore.performDatabaseOperations(client => client.query('TRUNCATE trails'))

      const id = await server.trailCore.insert({
        when: '2016-01-02T18:04:05.123+03:00',
        who: '1',
        what: '2',
        subject: '3'
      })

      const query = encodeQuery(`{
        trails(
          from: "2014-01-02T18:04:05.123+03:00"
          to: "2018-01-02T18:04:05.123+03:00"
        ) {
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

      const response = await server.inject({
        method: 'GET',
        url: `${prefix}/graphql?query=${query}`
      })

      expect(response.statusCode).to.equal(200)
      const { data: { trails } } = JSON.parse(response.payload)

      expect(trails[0]).to.include({
        id: id,
        when: DateTime.fromISO('2016-01-02T15:04:05.123Z', { zone: 'utc' }).toISO(),
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
  })

  describe(`POST ${prefix}/graphql - insert mutations`, async () => {
    test('create new trail from graphql payload and return with 201', async () => {
      const when = '2016-01-02T15:04:05.123Z'
      const who = 'me'
      const what = 'FOO'
      const subject = 'FOO'

      const response = await server.inject({
        method: 'POST',
        url: `${prefix}/graphql`,
        headers: {
          'Content-Type': 'application/graphql'
        },
        payload: `mutation {
          trail: insertTrail(when: "${when}", who: "${who}", what: "${what}", subject: "${subject}") {
            id
            when
            who
            what
            subject
            where
            why
            meta
          }
        }`
      })

      expect(response.statusCode).to.equal(200)
      const { data: { trail } } = JSON.parse(response.payload)

      expect(trail).to.include({
        when: DateTime.fromISO(when, { zone: 'utc' }).toISO(),
        who: {
          id: who,
          attributes: {}
        },
        what: {
          id: what,
          attributes: {}
        },
        subject: {
          id: subject,
          attributes: {}
        },
        where: {},
        why: {},
        meta: {}
      })

      await server.trailCore.delete(trail.id)
    })
  })
})
