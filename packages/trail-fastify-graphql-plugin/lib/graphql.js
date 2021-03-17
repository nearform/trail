'use strict'

const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')
const { GraphQLJSON } = require('./graphql-json-type')
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
      // See note above in parseValue() method.
      return ast.value
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

  type Trails {
    count: Int!
    data: [Trail!]!
  }

  type Query {

    trail(id: Int!): Trail

    trails(
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
    ): Trails!

    enumerateTrails(
      from: Date!
      to: Date!
      type: TrailType!
      page: Int
      pageSize: Int
      descending: Boolean
    ): [String!]!

  }

  type Mutation {

    insertTrail(
      when: Date!
      who: StringWithAttrs!
      what: StringWithAttrs!
      subject: StringWithAttrs!
      where: JSON
      why: JSON
      meta: JSON
    ): Trail

    updateTrail(
      id: Int!
      when: Date
      who: StringWithAttrs
      what: StringWithAttrs
      subject: StringWithAttrs
      where: JSON
      why: JSON
      meta: JSON
    ): Trail

    deleteTrail(id: Int!): Boolean!

  }
`

function makeResolvers (opts) {
  const {
    logger,
    db,
    pool,
    trailsManager = new TrailsManager({ logger, db, pool })
  } = opts

  return {
    Query: {
      trail (_, { id }) {
        return trailsManager.get(id)
      },
      trails (_, args) {
        return trailsManager.search(args)
      },
      enumerateTrails (_, args) {
        return trailsManager.enumerate(args)
      }
    },
    Mutation: {
      async insertTrail (_, trail) {
        const id = await trailsManager.insert(trail)
        return id ? trailsManager.get(id) : null
      },
      async updateTrail (_, { id, ...trail }) {
        const record = await trailsManager.get(id)
        if (!record) {
          return null
        }
        const { id: x, ...fields } = record
        const ok = await trailsManager.update(id, { ...fields, ...trail })
        return ok ? trailsManager.get(id) : null
      },
      deleteTrail (_, { id }) {
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
