'use strict'

const { parse } = require('graphql')
const { makeExecutableSchema } = require('graphql-tools')
const { compileQuery, isCompiledQuery } = require('graphql-jit')
const { typeDefs, makeResolvers } = require('.')

function makeQueryExecutor (opts) {
  const resolvers = makeResolvers(opts)
  const schema = makeExecutableSchema({ typeDefs, resolvers })
  return graphql => {
    const document = parse(graphql)
    const query = compileQuery(schema, document)
    if (!isCompiledQuery(query)) {
      throw new Error('Query compilation error')
    }
    return query.query()
  }
}

module.exports = { makeQueryExecutor }
