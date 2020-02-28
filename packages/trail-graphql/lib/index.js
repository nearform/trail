'use strict'

const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')
const { GraphQLJSON } = require('graphql-type-json')
const { DateTime } = require('luxon')
const { TrailsManager } = require('@nearform/trail-core')

const Date = new GraphQLScalarType({
  name: 'Date',
  description: 'ISO 8601 formatted date scalar type',
  parseValue (value) {
    if (typeof value === 'string') {
      // Assume value is in correct ISO format and return unparsed; trail-core will handle
      // the necessary conversion.
      return value
    }
    if (value instanceof DateTime) {
      // Convert to ISO string when passed an actual DateTime instance; this avoids problems
      // when trail-core is using a different version of luxon (e.g. because of non-hoisted
      // packages in a monorepo setting).
      return value.toISO()
    }
    return null
  },
  serialize (value) {
    return value.toISO()
  },
  parseLiteral (ast) {
    if (ast.kind === Kind.STRING) {
      return DateTime.fromISO(ast.value)
    }
    return null
  }
})

const StringWithAttrs = new GraphQLScalarType({
  name: 'StringWithAttrs',
  description: 'An object representing a string by value, or by ID with associated attributes',
  parseValue (value) {
    if (typeof value === 'string') {
      return { id: value }
    }
    if (typeof value === 'object' && typeof value.id === 'string') {
      return value
    }
    return null
  },
  serialize (value) {
    return value
  },
  parseLiteral (ast) {
    if (ast.kind === Kind.STRING) {
      return { id: ast.value }
    }
    if (ast.kind === Kind.OBJECT) {
      const value = GraphQLJSON.parseLiteral(ast)
      if (typeof value === 'object' && typeof value.id === 'string') {
        return value
      }
    }
    return null
  }
})

const SortOrder = {
  ID_ASC: 'id',
  WHEN_ASC: 'when',
  WHO_ASC: 'who',
  WHAT_ASC: 'what',
  SUBJECT_ASC: 'subject',
  ID_DESC: '-id',
  WHEN_DESC: '-when',
  WHO_DESC: '-who',
  WHAT_DESC: '-what',
  SUBJECT_DESC: '-subject'
}

const TrailType = {
  WHO: 'who',
  WHAT: 'what',
  SUBJECT: 'subject'
}

const typeDefs = `
  scalar Date
  scalar StringWithAttrs
  scalar JSON

  enum SortOrder { ${Object.keys(SortOrder).join(' ')} }

  enum TrailType { ${Object.keys(TrailType).join(' ')} }

  type Trail {
    id: Int!
    when: Date!
    who: StringWithAttrs!
    what: StringWithAttrs!
    subject: StringWithAttrs!
    where: JSON
    why: JSON
    meta: JSON
  }

  type Query {

    trail(id: Int!): Trail

    search(
      from: Date!
      to: Date!
      who: String
      what: String
      subject: String
      page: Int
      pageSize: Int
      sort: SortOrder
      exactMatch: Boolean
      caseInsensitive: Boolean
    ): [Trail!]!

    enumerate(
      from: Date!
      to: Date!
      type: TrailType!
      page: Int
      pageSize: Int
      descending: Boolean
    ): [String!]!

  }

  type Mutation {

    insert(
      when: Date!
      who: StringWithAttrs!
      what: StringWithAttrs!
      subject: StringWithAttrs!
      where: JSON
      why: JSON
      meta: JSON
    ): Int!

    update(
      id: Int!
      when: Date!
      who: StringWithAttrs!
      what: StringWithAttrs!
      subject: StringWithAttrs!
      where: JSON
      why: JSON
      meta: JSON
    ): Boolean!

    remove(id: Int!): Boolean!

  }
`

function makeResolvers (opts) {
  const {
    logger,
    pool,
    trailsManager = new TrailsManager(logger, pool)
  } = opts

  return {
    Query: {
      trail (_, { id }) {
        return trailsManager.get(id)
      },
      search (_, args) {
        return trailsManager.search(args)
      },
      enumerate (_, args) {
        return trailsManager.enumerate(args)
      }
    },
    Mutation: {
      insert (_, trail) {
        return trailsManager.insert(trail)
      },
      update (_, { id, ...trail }) {
        return trailsManager.update(id, trail)
      },
      // NOTE: This resolver should be called 'delete' but graphql-jit has problems
      // with the name (presumably because of clash with the JS 'delete' keyword).
      remove (_, { id }) {
        return trailsManager.delete(id)
      }
    },
    Date,
    StringWithAttrs,
    JSON: GraphQLJSON,
    SortOrder,
    TrailType
  }
}

module.exports = { typeDefs, makeResolvers }
