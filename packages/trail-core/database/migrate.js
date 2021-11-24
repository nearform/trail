#!/usr/bin/env node

'use strict'

const { loadSettings } = require('./settings')
const Postgrator = require('postgrator')
const { Client } = require('pg')
const path = require('path')

async function run () {
  const { version, host, port, database, username, password, idleTimeoutMillis } = loadSettings()
  const migrationPattern =  path.join(__dirname, '/migrations/*.sql')
  if (!version) throw new Error('Please provide the version to migrate to')

  const client = new Client({
    host,
    port,
    database,
    user: username,
    password,
    idleTimeoutMillis
  })

  await client.connect()

  const postgrator = new Postgrator({
    driver: 'pg',
    migrationPattern,
    schemaTable: 'schemaversion',
    database,
    execQuery: (query) => client.query(query)
  })

  await postgrator.migrate(version)
  console.log(`\x1b[32m\u2714 Database \x1b[1m${database}\x1b[22m migrated successfully to version ${version}!\x1b[0m`)
  await client.end()
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
