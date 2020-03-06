'use strict'

const gql = require('fastify-gql')
const fp = require('fastify-plugin')
const { makeExecutableSchema } = require('graphql-tools')

const { typeDefs, makeResolvers } = require('./graphql')

async function graphql (server, options) {
  const {
    // Allow some fastify-gql options to be specified in this plugin's config.
    graphiql,
    path,
    prefix,
    // Trails manager db + logger settings.
    logger,
    db,
    pool,
    // A pre-configured trails manager instance.
    trailsManager
  } = options
  // Compile the schema.
  const resolvers = makeResolvers({ logger, db, pool, trailsManager })
  const schema = makeExecutableSchema({ typeDefs, resolvers })
  // Register the gql plugin.
  server.register(gql, { schema, graphiql, path, prefix })
}

module.exports = fp(graphql, { name: 'trail-fastify-graphql-plugin' })
