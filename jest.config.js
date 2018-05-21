'use strict'

module.exports = {
  'collectCoverageFrom': [
    'lib/*.js',
    'lib/**/*.js'
  ],
  'coverageReporters': [
    'text',
    'text-lcov',
    'html'
  ],
  'testMatch': [
    '**/*.test.js'
  ]
}
