const {DateTime} = require('luxon')

class TrailComponent {
  constructor (attributes, idKey = 'id') {
    const isObject = typeof attributes === 'object'
    if ((!isObject && typeof attributes !== 'string') || Array.isArray(attributes)) {
      throw new Error(`A trail component must be initialized either with a string or a object.`)
    } else if (isObject && !attributes.hasOwnProperty(idKey)) throw new Error(`The "${idKey}" property of a trail component must be defined.`)

    // Normalize object
    if (!isObject) attributes = {[idKey]: attributes}

    // Validate the id
    this.id = attributes[idKey]
    if (typeof this.id !== 'string' || !this.id.trim().length) throw new Error(`The id of a trail component must be a non empty string.`)

    this.attributes = Object.assign({}, attributes) // Clone the object
    Reflect.deleteProperty(this.attributes, idKey)
  }
}

class Trail {
  constructor (id, when, who, what, subject, where = {}, why = {}, meta = {}) {
    this.id = id
    this.when = this._parseWhen(when)
    this.who = who instanceof TrailComponent ? who : new TrailComponent(who)
    this.what = what instanceof TrailComponent ? what : new TrailComponent(what)
    this.subject = subject instanceof TrailComponent ? subject : new TrailComponent(subject)
    this.where = where
    this.why = why
    this.meta = meta

    // Validate some fields
    if (typeof where !== 'object' && typeof where !== 'undefined') throw new Error(`The where argument must be either undefined or an object.`)
    if (typeof why !== 'object' && typeof why !== 'undefined') throw new Error(`The why argument must be either undefined or an object.`)
    if (typeof meta !== 'object' && typeof meta !== 'undefined') throw new Error(`The meta argument must be either undefined or an object.`)
  }

  _parseWhen (original) {
    if (original instanceof DateTime) return original.setZone('utc')
    else if (original instanceof Date) return DateTime.fromMillis(original.getTime(), {zone: 'utc'})
    else if (typeof original !== 'string') throw new Error(`Only Luxon DateTime, JavaScript Date or ISO8601 are supported for dates.`)

    const when = DateTime.fromISO(original)
    if (!when.isValid) throw new Error(`Invalid date "${original}". Please specify a valid UTC date in ISO8601 format.`)

    return when.setZone('utc')
  }
}

module.exports = {Trail, TrailComponent}
