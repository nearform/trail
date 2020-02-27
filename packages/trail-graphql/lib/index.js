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
    return DateTime.fromISO(value)
  },
  serialize (value) {
    return value
  },
  parseLiteral (ast) {
    if (ast.kind === Kind.STRING) {
      return DateTime.fromISO(ast.value)
    }
    return null
  }
})

const StringData = new GraphQLScalarType({
  name: 'StringData',
  description: 'An object representing a string by value or by ID with attributes',
  parseValue (value) {
    console.error('parseValue', value)
    return value
  },
  serialize (value) {
    // return value.id
    return value
  },
  parseLiteral (ast) {
    if (ast.kind === Kind.STRING) {
      return { id: ast.value }
    }
    if (ast.kind === Kind.OBJECT) {
      // TODO Possibly just need to return the parsed JSON as-is, after confirming an id property exists
      const { id, ...attributes } = GraphQLJSON.parseLiteral(value)
      return { id, attributes }
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
  scalar StringData
  scalar JSON

  enum SortOrder { ${Object.keys(SortOrder).join(' ')} }

  enum TrailType { ${Object.keys(TrailType).join(' ')} }

  type Trail {
    id: Int!
    when: Date!
    who: StringData!
    what: StringData!
    subject: StringData!
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
      who: StringData!
      what: StringData!
      subject: StringData!
      where: JSON
      why: JSON
      meta: JSON
    ): Int!

    update(
      id: Int!
      when: Date!
      who: StringData!
      what: StringData!
      subject: StringData!
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
      // NOTE graphql-jit has problems with 'delete' when used as a name.
      remove (_, { id }) {
        return trailsManager.delete(id)
      }
    },
    Date,
    StringData,
    JSON: GraphQLJSON,
    SortOrder,
    TrailType
  }
}

module.exports = { typeDefs, makeResolvers }
