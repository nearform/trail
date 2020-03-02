
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
