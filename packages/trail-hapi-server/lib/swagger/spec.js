'use strict'

const config = require('config')
const joiToSchema = require('joi-to-json-schema')

const host = config.get('hapi.host')
const port = config.get('hapi.port')
const {trailSchema, errorsSchemas} = require('@nearform/trail-hapi-plugin/lib/schemas')

module.exports = {
  openapi: '3.0.1',
  info: {
    title: 'Trail API Documentation',
    description: 'This page documents Trail\'s API endpoints, along with their various inputs and outputs. For more information about Trail please see the <a href="https://nearform.github.io/trail">Documentation Site.</a>',
    contact: {
      name: 'nearForm',
      url: 'https://github.com/nearform/trail',
      email: 'ireland@nearform.com'
    },
    license: {
      name: 'MIT',
      url: 'https://choosealicense.com/licenses/mit/'
    },
    version: require('../../package').version
  },
  servers: [
    {
      url: `http://${[host, port].join(':')}/`,
      description: 'Current API server'
    }
  ],
  tags: [
    {
      name: 'trails',
      description: 'Manage audit trails'
    },
    {
      name: 'monitoring',
      description: 'Endpoints for monitoring and uptime'
    }
  ],
  components: {
    models: {
      'trail.params.id': joiToSchema(trailSchema.params.id),
      'trail.request': joiToSchema(trailSchema.request),
      'trail.response': joiToSchema(trailSchema.response)
    },
    errors: {
      400: joiToSchema(errorsSchemas['400']),
      404: joiToSchema(errorsSchemas['404']),
      422: joiToSchema(errorsSchemas['422']),
      500: joiToSchema(errorsSchemas['500'])
    }
  },
  paths: {}
}
