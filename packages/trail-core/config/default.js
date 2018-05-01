'use strict'

module.exports = {
  db: {
    host: 'localhost',
    port: 5432,
    database: 'trails',
    username: 'postgres',
    password: 'postgres',
    poolSize: 10,
    idleTimeoutMillis: 30000
  }
}
