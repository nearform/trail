const SQL = require('@nearform/sql')
const pino = require('pino')
const {Pool} = require('pg')
const {badImplementation} = require('boom')

const {Trail, TrailComponent} = require('./trail')

class TrailsManager {
  constructor () {
    this.config = require('config')

    this.logger = pino()

    this.dbConnectionInfo = {
      host: this.config.get('db.host'),
      port: this.config.get('db.port'),
      database: this.config.get('db.database'),
      user: this.config.get('db.username'),
      password: this.config.get('db.password'),
      max: this.config.get('db.poolSize'),
      idleTimeoutMillis: this.config.get('db.idleTimeoutMillis')
    }

    this.dbPool = new Pool(this.dbConnectionInfo)
  }

  async close () {
    try {
      this.dbPool.end()
    } catch (e) {
      throw this._wrapError(e)
    }
  }

  async performDatabaseOperations (operations, useTransaction = true) {
    let client = null

    try {
      // Connect to the pool, then perform the operations
      client = await this.dbPool.connect()
      if (useTransaction) await client.query('BEGIN')
      const result = await operations(client)

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

  async insert (trailOrWhen, who, what, subject, where = {}, why = {}, meta = {}) {
    try {
      const trail = trailOrWhen instanceof Trail ? trailOrWhen : new Trail(null, trailOrWhen, who, what, subject, where, why, meta)

      const sql = SQL`
        INSERT
          INTO trails ("when", who_id, what_id, subject_id, who_data, what_data, subject_data, where_data, why_data, meta)
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

      const res = await this.performDatabaseOperations(client => client.query(sql))

      return res.rows[0].id
    } catch (e) {
      throw this._wrapError(e)
    }
  }

  async get (id) {
    try {
      const sql = SQL`
        SELECT
            timezone('UTC', "when") as "when",
            who_id,
            what_id,
            subject_id,
            who_data as who,
            what_data as what,
            subject_data as subject,
            where_data as "where",
            why_data as why,
            meta
          FROM trails
          WHERE id = ${id}
      `
      const res = await this.performDatabaseOperations(client => client.query(sql))

      if (res.rowCount === 0) return null

      const data = res.rows[0]

      // Merge ids on their fields
      data.who.id = data.who_id
      data.what.id = data.what_id
      data.subject.id = data.subject_id

      const {when, who, what, subject, where, why, meta} = data
      return new Trail(id, when, who, what, subject, where, why, meta)
    } catch (e) {
      throw this._wrapError(e)
    }
  }

  async update (id, trailOrWhen, who, what, subject, where = {}, why = {}, meta = {}) {
    try {
      const trail = trailOrWhen instanceof Trail ? trailOrWhen : new Trail(null, trailOrWhen, who, what, subject, where, why, meta)

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
            where_data = ${trail.where.attributes},
            why_data = ${trail.why.attributes},
            meta = ${trail.meta.attributes}
          WHERE id = ${id}
      `
      const res = await this.performDatabaseOperations(client => client.query(sql))

      return res.rowCount !== 0
    } catch (e) {
      throw this._wrapError(e)
    }
  }

  async delete (id) {
    try {
      const sql = SQL`
        DELETE
          FROM trails
          WHERE id = ${id}
      `
      const res = await this.performDatabaseOperations(client => client.query(sql))

      return res.rowCount !== 0
    } catch (e) {
      throw this._wrapError(e)
    }
  }

  _wrapError (error) {
    if (error.isBoom) return error

    const wrapped = badImplementation(error)
    if (error && error.code) wrapped.code = error.code

    return wrapped
  }
}

module.exports = {TrailsManager, TrailComponent, Trail}
