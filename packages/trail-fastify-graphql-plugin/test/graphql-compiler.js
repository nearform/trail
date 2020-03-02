'use strict'

const { parse } = require('graphql')
const { makeExecutableSchema } = require('graphql-tools')
const { compileQuery, isCompiledQuery } = require('graphql-jit')
const { typeDefs, makeResolvers } = require('../lib/graphql')

function makeQueryExecutor (opts) {
  const resolvers = makeResolvers(opts)
  const schema = makeExecutableSchema({ typeDefs, resolvers })
  return (graphql, args) => {
    const document = parse(graphql)
    const query = compileQuery(schema, document)
    if (!isCompiledQuery(query)) {
      throw new Error('Query compilation error: ' + query.errors.map(e => e.message).join('; '))
    }
    return query.query(null, null, args)
  }
}

module.exports = { makeQueryExecutor }
