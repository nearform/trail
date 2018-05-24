'use strict'

const { expect } = require('code')
const Lab = require('lab')

module.exports.lab = Lab.script()
const { describe, it: test } = module.exports.lab

const {DateTime} = require('luxon')

const {convertToTrail} = require('../lib/trail')

describe('createTrail and createTrailFromObject', () => {
  test('should parse string timestamps and copy fields', () => {
    const subject = convertToTrail({
      id: 0,
      when: DateTime.fromISO('2018-01-01T12:34:56', {zone: 'utc'}),
      who: 'who',
      what: 'what',
      subject: 'subject',
      where: {a: 1},
      why: {b: 2},
      meta: {c: 3}
    })

    expect(subject.when).to.equal(DateTime.fromISO('2018-01-01T12:34:56', {zone: 'utc'}))
    expect(subject.who.id).to.equal('who')
    expect(subject.what.id).to.equal('what')
    expect(subject.subject.id).to.equal('subject')
    expect(subject.where).to.equal({a: 1})
    expect(subject.why).to.equal({b: 2})
    expect(subject.meta).to.equal({c: 3})
  })

  test('should allow objects as arguments', () => {
    const subject = convertToTrail({id: 0, when: new Date(2018, 1, 1, 12, 34, 56), who: {id: 'who'}, what: {id: 'what'}, subject: {id: 'subject'}})

    expect(subject.who.id).to.equal('who')
    expect(subject.what.id).to.equal('what')
    expect(subject.subject.id).to.equal('subject')
  })

  test('should raise an error if attribute "id" is not null or a string', () => {
    expect(() => {
      convertToTrail({id: 'id'})
    }).to.throw('The trail id must be a number or null.')
  })

  test('should raise an error if attribute "date" isn\'t a string', () => {
    expect(() => {
      convertToTrail({id: 0, when: {}, who: 'who', what: 'what', subject: 'subject'})
    }).to.throw('Only Luxon DateTime, JavaScript Date or ISO8601 are supported for dates.')
  })

  test('should raise an error if attribute "date" isn\'t a valid date', () => {
    expect(() => {
      convertToTrail({id: 0, when: 'not a valid date', who: 'who', what: 'what', subject: 'subject'})
    }).to.throw('Invalid date "not a valid date". Please specify a valid UTC date in ISO8601 format.')
  })

  test('should create a field from a string', () => {
    const subject = convertToTrail({id: 0, when: '2018-01-01T12:34:56', who: 'who', what: 'what', subject: 'subject'})

    expect(subject.who.id).to.equal('who')
    expect(subject.who.attributes).to.equal({})
  })

  test('should create a field from a object, excluding the id from the attributes', () => {
    const who = {id: '1', a: 2, b: 3}
    const subject = convertToTrail({id: 0, when: '2018-01-01T12:34:56', who, what: 'WHAT', subject: 'SUBJECT'})

    expect(who).to.equal({id: '1', a: 2, b: 3})
    expect(subject.who.id).to.equal('1')
    expect(subject.who.attributes).to.equal({a: 2, b: 3})
  })

  test('should require the id property of a component to be defined', () => {
    expect(() => {
      convertToTrail({id: 0, when: '2018-01-01T12:34:56', who: {a: '1'}, what: 'WHAT', subject: 'SUBJECT'})
    }).to.throw('The "id" property of the "who" field must be a string.')
  })

  test('should not allow non objects and non strings as input', () => {
    expect(() => {
      convertToTrail({id: 0, when: '2018-01-01T12:34:56', who: 123, what: 'WHAT', subject: 'SUBJECT'})
    }).to.throw('The "who" field must be either a string or a object.')
  })

  test('should not allow empty strings as input', () => {
    expect(() => {
      convertToTrail({id: 0, when: '2018-01-01T12:34:56', who: '', what: 'WHAT', subject: 'SUBJECT'})
    }).to.throw('The "who" field when passed as a string must be non empty.')

    expect(() => {
      convertToTrail({id: 0, when: '2018-01-01T12:34:56', who: {id: ''}, what: 'WHAT', subject: 'SUBJECT'})
    }).to.throw('The "id" property of the "who" field must be a non empty string.')
  })

  test('should raise an error if field "where" is neither undefined or an object', () => {
    expect(() => {
      convertToTrail({id: 0, when: '2018-01-01T12:34:56', who: 'who', what: 'what', subject: 'subject', where: 'invalid value'})
    }).to.throw('The where field must be either undefined or an object.')
  })

  test('should raise an error if field "why" is neither undefined or an object', () => {
    expect(() => {
      convertToTrail({id: 0, when: '2018-01-01T12:34:56', who: 'who', what: 'what', subject: 'subject', where: null, why: 'invalid value'})
    }).to.throw('The why field must be either undefined or an object.')
  })

  test('should raise an error if field "meta" is neither undefined or an object', () => {
    expect(() => {
      convertToTrail({id: 0, when: '2018-01-01T12:34:56', who: 'who', what: 'what', subject: 'subject', where: null, why: null, meta: 'invalid value'})
    }).to.throw('The meta field must be either undefined or an object.')
  })
})
