'use strict'

const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')
const { DateTime } = require('luxon')
const { TrailsManager } = require('@nearform/trail-core')

const Date = new GraphQLScalarType({
  name: 'Date',
  description: 'ISO 8601 formatted date scalar type',
  parseValue (value) {
    return DateTime.fromISO(value)
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

const StringID = new GraphQLScalarType({
  name: 'StringID',
  description: 'An object representing a string value by ID',
  parseValue (value) {
    return value
  },
  serialize (value) {
    return value.id
  },
  parseLiteral (ast) {
    if (ast.kind === Kind.STRING) {
      return ast.value
    }
    return null
  }
})

const JSON = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON value',
  parseValue (value) {
    return JSON.parse(value)
  },
  serialize (value) {
    return JSON.stringify(value)
  },
  parseLiteral (ast) {
    if (ast.kind === Kind.STRING) {
      return JSON.parse(ast.value)
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
  scalar StringID
  scalar JSON

  enum SortOrder { ${Object.keys(SortOrder).join(' ')} }

  enum TrailType { ${Object.keys(TrailType).join(' ')} }

  type Trail {
    id: Int!
    when: Date!
    who: StringID!
    what: StringID!
    subject: StringID!
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

    insert(trail: Trail!): Int!

    update(id: Int!, trail: Trail!): Boolean!

    delete(id: Int!): Boolean!

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
      insert (_, { trail }) {
        return trailsManager.insert(trail)
      },
      update (_, { id, trail }) {
        return trailsManager.update(id, trail)
      },
      delete (_, { id }) {
        return trailsManager.delete(id)
      }
    },
    Date,
    StringID,
    JSON,
    SortOrder,
    TrailType
  }
}

module.exports = { typeDefs, makeResolvers }
