'use strict'

require('dotenv').config()
const { env } = process

const minimist = require('minimist')
const argv = minimist(process.argv)

exports.loadSettings = options => {
  const resolve = (optName, envName, defaultValue) => {
    let value
    if (options && options[optName] !== undefined) {
      value = options[optName]
    } else if (argv[optName] !== undefined) {
      value = argv[optName]
    } else if (env[envName] !== undefined) {
      value = env[envName]
    } else value = defaultValue

    switch (typeof defaultValue) {
      case 'boolean':
        return Boolean(value)
      case 'number':
        return Number(value)
      default:
        return value
    }
  }

  const settings = {
    db: {
      host: resolve('dbHost', 'TRAIL_DB_HOST', 'localhost'),
      port: resolve('dbPort', 'TRAIL_DB_PORT', '5432'),
      database: resolve('dbName', 'TRAIL_DB_NAME', 'trails'),
      user: resolve('dbUsername', 'TRAIL_DB_USERNAME', 'postgres'),
      password: resolve('dbPassword', 'TRAIL_DB_PASSWORD', 'postgres'),
      poolSize: resolve('dbPoolsize', 'TRAIL_DB_POOLSIZE', 10),
      timeout: resolve('dbTimeout', 'TRAIL_DB_TIMEOUT', 30000)
    },
    http: {
      host: resolve('httpHost', 'TRAIL_HTTP_HOST', 'localhost'),
      port: resolve('httpPort', 'TRAIL_HTTP_PORT', 8080)
    },
    use: {
      restAPI: resolve('useRESTAPI', 'TRAIL_USE_REST_API', true),
      graphQL: resolve('useGraphQL', 'TRAIL_USE_GRAPHQL', true)
    }
  }

  return settings
}
