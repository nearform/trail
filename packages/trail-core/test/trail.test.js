'use strict'

const {DateTime} = require('luxon')
require('./utils')

const {convertToTrail, createTrail} = require('../lib/trail')

describe('createTrail and createTrailFromObject', () => {
  test('should parse string timestamps and copy fields', () => {
    const subject = convertToTrail({
      id: 0,
      when: DateTime.fromISO('2018-01-01T12:34:56'),
      who: 'who',
      what: 'what',
      subject: 'subject',
      where: {a: 1},
      why: {b: 2},
      meta: {c: 3}
    })

    expect(subject.when).toBeSameDate('2018-01-01T12:34:56')
    expect(subject.who.id).toEqual('who')
    expect(subject.what.id).toEqual('what')
    expect(subject.subject.id).toEqual('subject')
    expect(subject.where).toEqual({a: 1})
    expect(subject.why).toEqual({b: 2})
    expect(subject.meta).toEqual({c: 3})
  })

  test('should allow objects as arguments', () => {
    const subject = createTrail(0, new Date(2018, 1, 1, 12, 34, 56), {id: 'who'}, {id: 'what'}, {id: 'subject'})

    expect(subject.who.id).toEqual('who')
    expect(subject.what.id).toEqual('what')
    expect(subject.subject.id).toEqual('subject')
  })

  test('should raise an error if attribute "id" is not null or a string', () => {
    expect(() => {
      createTrail('id')
    }).toThrow('The trail id must be a number or null.')
  })

  test('should raise an error if attribute "date" isn\'t a string', () => {
    expect(() => {
      createTrail(0, {}, 'who', 'what', 'subject')
    }).toThrow('Only Luxon DateTime, JavaScript Date or ISO8601 are supported for dates.')
  })

  test('should raise an error if attribute "date" isn\'t a valid date', () => {
    expect(() => {
      createTrail(0, 'not a valid date', 'who', 'what', 'subject', null, null, 'invalid value')
    }).toThrow('Invalid date "not a valid date". Please specify a valid UTC date in ISO8601 format.')
  })

  test('should create a field from a string', () => {
    const subject = createTrail(0, '2018-01-01T12:34:56', 'WHO', 'WHAT', 'SUBJECT')

    expect(subject.who.id).toEqual('WHO')
    expect(subject.who.attributes).toEqual({})
  })

  test('should create a field from a object, excluding the id from the attributes', () => {
    const who = {id: '1', a: 2, b: 3}
    const subject = createTrail(0, '2018-01-01T12:34:56', who, 'WHAT', 'SUBJECT')

    expect(who).toEqual({id: '1', a: 2, b: 3})
    expect(subject.who.id).toEqual('1')
    expect(subject.who.attributes).toEqual({a: 2, b: 3})
  })

  test('should create a component from a object with a specific key as id', () => {
    const who = {id: 1, a: '2', b: 3}
    const subject = createTrail(0, '2018-01-01T12:34:56', who, 'WHAT', 'SUBJECT', {}, {}, {}, 'a')

    expect(who).toEqual({id: 1, a: '2', b: 3})
    expect(subject.who.id).toEqual('2')
    expect(subject.who.attributes).toEqual({id: 1, b: 3})
  })

  test('should require the id property of a component to be defined', () => {
    expect(() => {
      createTrail(0, '2018-01-01T12:34:56', {id: '1'}, 'WHAT', 'SUBJECT', {}, {}, {}, 'a')
    }).toThrow('The "a" property of the "who" field must be a string.')
  })

  test('should not allow non objects and non strings as input', () => {
    expect(() => {
      createTrail(0, '2018-01-01T12:34:56', 123, 'WHAT', 'SUBJECT')
    }).toThrow('The "who" field must be either a string or a object.')
  })

  test('should not allow empty strings as input', () => {
    expect(() => {
      createTrail(0, '2018-01-01T12:34:56', '', 'WHAT', 'SUBJECT')
    }).toThrow('The "who" field when passed as a string must be non empty.')

    expect(() => {
      createTrail(0, '2018-01-01T12:34:56', {a: ''}, 'WHAT', 'SUBJECT', {}, {}, {}, 'a')
    }).toThrow('The "a" property of the "who" field must be a non empty string.')
  })

  test('should raise an error if field "where" is neither undefined or an object', () => {
    expect(() => {
      createTrail(0, '2018-01-01T12:34:56', 'who', 'what', 'subject', 'invalid value')
    }).toThrow('The where field must be either undefined or an object.')
  })

  test('should raise an error if field "why" is neither undefined or an object', () => {
    expect(() => {
      createTrail(0, '2018-01-01T12:34:56', 'who', 'what', 'subject', null, 'invalid value')
    }).toThrow('The why field must be either undefined or an object.')
  })

  test('should raise an error if field "meta" is neither undefined or an object', () => {
    expect(() => {
      createTrail(0, '2018-01-01T12:34:56', 'who', 'what', 'subject', null, null, 'invalid value')
    }).toThrow('The meta field must be either undefined or an object.')
  })
})
