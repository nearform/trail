#!/usr/bin/env node

'use strict'

const {Client} = require('pg')
const config = require('./config')

// Gather arguments

async function run () {
  const {host, port, database, username: user, password, idleTimeoutMillis} = config()
  const client = new Client({host, port, database: 'postgres', user, password, idleTimeoutMillis})

  await client.connect()
  await client.query(`DROP DATABASE IF EXISTS ${database}`)
  await client.query(`CREATE DATABASE ${database}`)
  await client.end()
  console.log(`\x1b[32m\u2714 Database \x1b[1m${database}\x1b[22m created successfully!\x1b[0m`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
