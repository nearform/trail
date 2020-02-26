'use strict'
/*

const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')
const { TrailsManager } = require('@nearform/trail-core')

const Date = new GraphQLScalarType({
  name: 'Date',
  description: 'ISO 8601 formatted date scalar type',
  parseValue (value) {
    return new Date(value)
  },
  serialize (value) {
    return value.toISOString()
  },
  parseLiteral (ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value)
    }
    return null
  }
})

const sortOrderEnum = new GraphQLEnumType({
  name: 'SortOrder',
  description: 'Trail search result sort order',
  values: {
    ID_ASC: {
      value: 'id',
      description: 'Sort by ID ascending'
    },
    WHEN_ASC: {
      value: 'when',
      description: 'Sort by "when" ascending'
    },
    WHO_ASC: {
      value: 'who',
      description: 'Sort by "who" ascending'
    },
    WHAT_ASC: {
      value: 'what',
      description: 'Sort by "what" ascending'
    },
    SUBJECT_ASC: {
      value: 'subject',
      description: 'Sort by "subject" ascending'
    },
    ID_DESC: {
      value: '-id',
      description: 'Sort by ID descending'
    },
    WHEN_DESC: {
      value: '-when',
      description: 'Sort by "when" descending'
    },
    WHO_DESC: {
      value: '-who',
      description: 'Sort by "who" descending'
    },
    WHAT_DESC: {
      value: '-what',
      description: 'Sort by "what" descending'
    },
    SUBJECT_DESC: {
      value: '-subject',
      description: 'Sort by "subject" descending'
    }
  }
})

const trailTypeEnum = new GraphQLEnumType({
  name: 'TrailType',
  description: 'Trail type',
  values: {
    WHO: {
      value: 'who'
    },
    WHAT: {
      value: 'what'
    },
    SUBJECT: {
      value: 'subject'
    }
  }
})

const typedefs = `
  scalar Date

  enum SortOrder { ${Object.keys(SortOrder).join(' ')} }

  enum TrailType { ${Object.keys(TrailType).join(' ')} }

  interface Trail {
    id: Int!
    when: Date!
    who: String!
    what: String!
    subject: String!
    where: String
    why: String
    meta: String
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
    ): [Int!]!

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
    SortOrder,
    TrailType
  }
}

module.exports = { typedefs, makeResolvers }
*/
