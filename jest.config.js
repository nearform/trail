'use strict'

module.exports = {
  collectCoverageFrom: [
    'lib/*.js',
    'lib/**/*.js'
  ],
  coverageReporters: [
    'text',
    'html'
  ],
  testMatch: [
    '**/*.test.js'
  ]
}
