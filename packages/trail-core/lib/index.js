'use strict'

const SQL = require('@nearform/sql')
const pino = require('pino')
const { Pool } = require('pg')

const defaultPageSize = 25
const { parseDate, convertToTrail } = require('./trail')

const defaultDBPoolSettings = {
  host: 'localhost',
  port: 5432,
  database: 'trails',
  user: 'postgres',
  password: 'postgres',
  max: 10,
  idleTimeoutMillis: 30000
}

class TrailsManager {
  constructor (opts) {
    const {
        logger = pino(),
        db = {},
        pool = new Pool({ ...defaultDBPoolSettings, ...db })
    } = opts
    this.logger = logger
    this.dbPool = pool
  }

  async close () {
    return this.dbPool.end()
  }

  async performDatabaseOperations (operations, useTransaction = true) {
    let client = null

    try {
      // Connect to the pool, then perform the operations
      client = await this.dbPool.connect()
      if (useTransaction) await client.query('BEGIN')

      const result = typeof operations === 'function' ? await operations(client) : await client.query(operations)

      // Release the client, the return the result
      if (useTransaction) await client.query('COMMIT')
      client.release()
      return result
    } catch (e) {
      // If connection succeded, release the client
      if (client) {
        if (useTransaction) await client.query('ROLLBACK')
        client.release()
      }

      // Propagate any rejection
      throw e
    }
  }

  async search ({ from, to, who, what, subject, page, pageSize, sort, exactMatch = false, caseInsensitive = false } = {}) {
    // Validate parameters
    if (!from) throw new Error('You must specify a starting date ("from" attribute) when querying trails.')
    if (!to) throw new Error('You must specify a ending date ("to" attribute) when querying trails.')
    if (who && typeof who !== 'string') throw new TypeError('Only strings are supporting for searching in the id of the "who" field.')
    if (what && typeof what !== 'string') throw new TypeError('Only strings are supporting for searching in the id of the "what" field.')
    if (subject && typeof subject !== 'string') throw new TypeError('Only strings are supporting for searching in the id of the "subject" field.')

    from = parseDate(from)
    to = parseDate(to)

    // Sanitize pagination parameters
    ;({ page, pageSize } = this._sanitizePagination(page, pageSize))

    // Sanitize ordering
    const { sortKey, sortAsc } = this._sanitizeSorting(sort)

    // Perform the query
    const sql = SQL`
      SELECT
          id::int, timezone('UTC', "when") as "when",
          who_id, what_id, subject_id,
          who_data as who, what_data as what, subject_data as subject,
          "where", why, meta
        FROM trails
        WHERE
          ("when" >= ${from.toISO()} AND "when" <= ${to.toISO()})
    `

    const op = caseInsensitive ? 'ILIKE' : 'LIKE'
    if (who) sql.append(SQL([` AND who_id ${op} `])).append(SQL`${exactMatch ? who : '%' + who + '%'}`)
    if (what) sql.append(SQL([` AND what_id ${op} `])).append(SQL`${exactMatch ? what : '%' + what + '%'}`)
    if (subject) sql.append(SQL([` AND subject_id ${op} `])).append(SQL`${exactMatch ? subject : '%' + subject + '%'}`)

    const footer = ` ORDER BY ${sortKey} ${sortAsc ? 'ASC' : 'DESC'} LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`
    sql.append(SQL([footer]))

    const res = await this.performDatabaseOperations(sql)
    return res.rows.map(convertToTrail)
  }

  async enumerate ({ from, to, type, page, pageSize, desc } = {}) {
    // Validate parameters
    if (!from) throw new Error('You must specify a starting date ("from" attribute) when enumerating.')
    if (!to) throw new Error('You must specify a ending date ("to" attribute) when enumerating.')

    from = parseDate(from)
    to = parseDate(to)

    /*
      WARNING - @paolo on 2018-05-17

      The type parameter is used below to build the SELECT query. Due to its dynamic nature
      it is inserted without the @nearform/sql SQL injection protection.
      If you change the logic here make sure you don't create a security vulnerability.
    */
    if (!['who', 'what', 'subject'].includes(type)) throw new TypeError('You must select between "who", "what" or "subject" type ("type" attribute) when enumerating.')

    // Sanitize pagination parameters
    ;({ page, pageSize } = this._sanitizePagination(page, pageSize))

    // Perform the query
    const sql = SQL`
      SELECT
        DISTINCT ON($type$_id) $type$_id AS entry
        FROM trails
        WHERE
          ("when" >= ${from.toISO()} AND "when" <= ${to.toISO()})

    `

    const strings = Array.from(sql.strings)
    strings.splice(0, 1, strings[0].replace(/\$type\$/g, type))
    sql.strings = strings

    const footer = ` ORDER BY entry ${desc ? 'DESC' : 'ASC'} LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`
    sql.append(SQL([footer]))

    const res = await this.performDatabaseOperations(sql)

    return res.rows.map(r => r.entry)
  }

  async insert (trail) {
    trail = convertToTrail(trail)

    const sql = SQL`
      INSERT
        INTO trails ("when", who_id, what_id, subject_id, who_data, what_data, subject_data, "where", why, meta)
        VALUES (
          ${trail.when.toISO()},
          ${trail.who.id},
          ${trail.what.id},
          ${trail.subject.id},
          ${trail.who.attributes},
          ${trail.what.attributes},
          ${trail.subject.attributes},
          ${trail.where},
          ${trail.why},
          ${trail.meta}
        )
        RETURNING id::int;
    `

    const res = await this.performDatabaseOperations(sql)

    return res.rows[0].id
  }

  async get (id) {
    const sql = SQL`
      SELECT
          id::int,
          timezone('UTC', "when") as "when",
          who_id, what_id, subject_id,
          who_data as who, what_data as what, subject_data as subject,
          "where", why, meta
        FROM trails
        WHERE id = ${id}
    `
    const res = await this.performDatabaseOperations(sql)

    return res.rowCount > 0 ? convertToTrail(res.rows[0]) : null
  }

  async update (id, trail) {
    trail = convertToTrail(trail)

    const sql = SQL`
      UPDATE trails
        SET
          "when" = ${trail.when.toISO()},
          who_id = ${trail.who.id},
          what_id = ${trail.what.id},
          subject_id = ${trail.subject.id},
          who_data = ${trail.who.attributes},
          subject_data = ${trail.subject.attributes},
          what_data = ${trail.what.attributes},
          "where" = ${trail.where},
          why = ${trail.why},
          meta = ${trail.meta}
        WHERE id = ${id}
    `
    const res = await this.performDatabaseOperations(sql)

    return res.rowCount !== 0
  }

  async delete (id) {
    const sql = SQL`
      DELETE
        FROM trails
        WHERE id = ${id}
    `
    const res = await this.performDatabaseOperations(sql)

    return res.rowCount !== 0
  }

  _sanitizeSorting (sortKey) {
    let sortAsc = true

    if (!sortKey) return { sortKey: '"when"', sortAsc: false } // Default is -when

    if (sortKey.startsWith('-')) {
      sortAsc = false
      sortKey = sortKey.substring(1)
    }

    if (!['id', 'when', 'who', 'what', 'subject'].includes(sortKey)) {
      throw new TypeError('Only "id", "when", "who", "what" and "subject" are supported for sorting.')
    }

    // Perform some sanitization
    if (sortKey === 'when') sortKey = '"when"'
    else if (sortKey !== 'id') sortKey += '_id'

    return { sortKey: `${sortKey}`, sortAsc }
  }

  _sanitizePagination (page, pageSize) {
    page = typeof page === 'number' ? page : parseInt(page, 0)
    pageSize = typeof pageSize !== 'number' ? pageSize : parseInt(pageSize, 0)

    if (isNaN(page) || page < 1) { page = 1 }
    if (isNaN(pageSize) || pageSize < 1) { pageSize = defaultPageSize }

    return { page, pageSize }
  }
}

module.exports = { TrailsManager }
