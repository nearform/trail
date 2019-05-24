#!/usr/bin/env node

'use strict'

const config = require('config')
const minimist = require('minimist')

module.exports = function () {
  const argv = minimist(process.argv.slice(2))
  const version = (argv.version || '').toString()
  const host = argv.host || config.get('db.host')
  const port = argv.port || config.get('db.port')
  const database = argv.database || config.get('db.database')
  const username = argv.username || config.get('db.username')
  const password = argv.password || config.get('db.password')
  const idleTimeoutMillis = argv.idleTimeoutMillis || config.get('db.idleTimeoutMillis')

  return {config, version, host, port, database, username, password, idleTimeoutMillis}
}
