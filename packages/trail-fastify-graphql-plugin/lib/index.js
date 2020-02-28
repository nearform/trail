'use strict'

// https://github.com/mcollina/fastify-gql
const gql = require('fastify-gql')
const fp = require('fastify-plugin')
const { makeExecutableSchema } = require('graphql-tools')
const { typeDefs, makeResolvers } = require('@nearform/trail-graphql')

async function graphql (server, options) {
  // Allow some fastify-gql options to be specified in this plugin's config.
  const {
    graphiql,
    path,
    prefix
  } = options
  // Compile the schema.
  const resolvers = makeResolvers()
  const schema = makeExecutableSchema({ typeDefs, resolvers })
  // Register the gql plugin.
  server.register(gql, { schema, graphiql, path, prefix })
}

module.exports = fp(graphql, { name: 'trail-fastify-graphql-plugin' })
