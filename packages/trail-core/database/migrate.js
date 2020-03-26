#!/usr/bin/env node

'use strict'

const { loadSettings } = require('./settings')
const Postgrator = require('postgrator')
const path = require('path')

async function run () {
  const { version, host, port, database, username, password } = loadSettings()
  const migrationDirectory = path.join(__dirname, '/migrations')
  if (!version) throw new Error('Please provide the version to migrate to')

  const postgrator = new Postgrator({ driver: 'pg', migrationDirectory, schemaTable: 'schemaversion', host, port, database, username, password })

  await postgrator.migrate(version)
  console.log(`\x1b[32m\u2714 Database \x1b[1m${database}\x1b[22m migrated successfully to version ${version}!\x1b[0m`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
