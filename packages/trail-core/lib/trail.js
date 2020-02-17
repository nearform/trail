'use strict'

const { DateTime } = require('luxon')

const parseComponent = function (attributes, id, label) {
  // Copy an overriden id
  if (id && typeof attributes === 'object') attributes.id = id

  // When the value is just a string, just make sure is non empty, then return it
  if (typeof attributes === 'string') {
    if (!attributes.trim().length) {
      throw new Error(`The "${label}" field when passed as a string must be non empty.`)
    }

    return { id: attributes, attributes: {} }
  }

  // Valid the value format
  if (typeof attributes !== 'object' || Array.isArray(attributes)) {
    throw new Error(`The "${label}" field must be either a string or a object.`)
  } else if (typeof attributes.id !== 'string') {
    throw new Error(`The "id" property of the "${label}" field must be a string.`)
  }

  // Parse the id and make sure is non empty
  id = attributes.id.toString().trim()
  if (!id.length) throw new Error(`The "id" property of the "${label}" field must be a non empty string.`)

  // Clone the object (since we're removing properties), then remove the id
  attributes = Object.assign({}, attributes)
  Reflect.deleteProperty(attributes, 'id')

  return { id, attributes }
}

const parseDate = function (original) {
  if (original instanceof DateTime) return original.setZone('utc')
  else if (original instanceof Date) return DateTime.fromMillis(original.getTime(), { zone: 'utc' })
  else if (typeof original !== 'string') throw new Error('Only Luxon DateTime, JavaScript Date or ISO8601 are supported for dates.')

  const when = DateTime.fromISO(original)
  if (!when.isValid) throw new Error(`Invalid date "${original}". Please specify a valid UTC date in ISO8601 format.`)

  return when.setZone('utc')
}

const validateAdditionalFields = function (value, label) {
  const valid = (typeof value === 'object' || typeof value === 'undefined') && !Array.isArray(value)
  if (!valid) throw new Error(`The ${label} field must be either undefined or an object.`)

  return value || {}
}

module.exports = {
  parseDate,
  convertToTrail ({ id, when, who, what, subject, where, why, meta, who_id: whoId, what_id: whatId, subject_id: subjectId }) {
    // Convert required fields
    if (id !== null && typeof id !== 'undefined' && typeof id !== 'number') throw new Error('The trail id must be a number or null.')

    // Return the trail
    return {
      id,
      when: parseDate(when),
      who: parseComponent(who, whoId, 'who'),
      what: parseComponent(what, whatId, 'what'),
      subject: parseComponent(subject, subjectId, 'subject'),
      where: validateAdditionalFields(where, 'where'),
      why: validateAdditionalFields(why, 'why'),
      meta: validateAdditionalFields(meta, 'meta')
    }
  }
}
