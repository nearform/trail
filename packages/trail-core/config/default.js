'use strict'

module.exports = {
  db: {
    host: 'localhost',
    port: 5432,
    database: 'audit',
    username: 'postgres',
    password: 'postgres',
    poolSize: 10,
    idleTimeoutMillis: 30000
  }
}
