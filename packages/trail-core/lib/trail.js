'use strict'

const {DateTime} = require('luxon')

const parseComponent = function (value, label, idKey) {
  if (!idKey) idKey = 'id'

  // When the value is just a string, just make sure is non empty, then return it
  if (typeof value === 'string') {
    if (!value.trim().length) {
      throw new Error(`The "${label}" field when passed as a string must be non empty.`)
    }

    return [value, {}]
  }

  // Valid the value format
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`The "${label}" field must be either a string or a object.`)
  } else if (!value.hasOwnProperty(idKey) || typeof value[idKey] !== 'string') {
    throw new Error(`The "${idKey}" property of the "${label}" field must be a string.`)
  }

  // Parse the id and make sure is non empty
  const id = value[idKey].toString().trim()
  if (!id.length) throw new Error(`The "${idKey}" property of the "${label}" field must be a non empty string.`)

  // Clone the object (since we're removing properties), then remove the id
  value = Object.assign({}, value)
  Reflect.deleteProperty(value, idKey)

  return [id, value]
}

const parseWhen = function (original) {
  if (original instanceof DateTime) return original.setZone('utc')
  else if (original instanceof Date) return DateTime.fromMillis(original.getTime(), {zone: 'utc'})
  else if (typeof original !== 'string') throw new Error(`Only Luxon DateTime, JavaScript Date or ISO8601 are supported for dates.`)

  const when = DateTime.fromISO(original)
  if (!when.isValid) throw new Error(`Invalid date "${original}". Please specify a valid UTC date in ISO8601 format.`)

  return when.setZone('utc')
}

const validateAdditionalFields = function (value, label) {
  const valid = (typeof value === 'object' || typeof value === 'undefined') && !Array.isArray(value)
  if (!valid) throw new Error(`The ${label} field must be either undefined or an object.`)

  return value || {}
}

const convertToTrail = function ({id, when, who, what, subject, where, why, meta}, {who: whoIdKey, what: whatIdKey, subject: subjectIdKey} = {}) {
  // Convert required fields
  if (id !== null && typeof id !== 'undefined' && typeof id !== 'number') throw new Error(`The trail id must be a number or null.`)

  when = parseWhen(when)
  const [whoId, whoAttributes] = parseComponent(who, 'who', whoIdKey)
  const [whatId, whatAttributes] = parseComponent(what, 'what', whatIdKey)
  const [subjectId, subjectAttributes] = parseComponent(subject, 'subject', subjectIdKey)

  // Validate optional fields
  where = validateAdditionalFields(where, 'where')
  why = validateAdditionalFields(why, 'why')
  meta = validateAdditionalFields(meta, 'meta')

  // Return the trail
  return {
    id,
    when,
    who: {id: whoId, attributes: whoAttributes},
    what: {id: whatId, attributes: whatAttributes},
    subject: {id: subjectId, attributes: subjectAttributes},
    where,
    why,
    meta
  }
}

module.exports = {
  convertToTrail,

  createTrail (id, when, who, what, subject, where = {}, why = {}, meta = {}, whoIdKey = 'id', whatIdKey = 'id', subjectIdKey = 'id') {
    return convertToTrail({id, when, who, what, subject, where, why, meta}, {who: whoIdKey, what: whatIdKey, subject: subjectIdKey})
  }
}
