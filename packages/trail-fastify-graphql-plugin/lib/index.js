'use strict'

// https://github.com/mcollina/fastify-gql
const gql = require('fastify-gql')
const fp = require('fastify-plugin')
const { makeExecutableSchema } = require('graphql-tools')
const { typeDefs, makeResolvers } = require('@nearform/trail-graphql')

async function graphql (server, options) {
  const {
    // Allow some fastify-gql options to be specified in this plugin's config.
    graphiql,
    path,
    prefix,
    // Allow a trails manager instance to be provided.
    trailsManager
  } = options
  // Compile the schema.
  const resolvers = makeResolvers({ trailsManager })
  const schema = makeExecutableSchema({ typeDefs, resolvers })
  // Register the gql plugin.
  server.register(gql, { schema, graphiql, path, prefix })
}

module.exports = fp(graphql, { name: 'trail-fastify-graphql-plugin' })
