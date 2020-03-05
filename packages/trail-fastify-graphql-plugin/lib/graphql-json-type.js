'use strict'

const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')

function parseObject (ast) {
  return ast.fields.reduce((obj, field) => {
    obj[field.name.value] = parseLiteral(field.value)
    return obj
  }, Object.create(null))
}

function parseLiteral (ast) {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value)
    case Kind.OBJECT:
      return parseObject(ast)
    case Kind.LIST:
      return ast.values.map(parseLiteral)
    case Kind.NULL:
      return null
    default:
      return undefined
  }
}

const GraphQLJSON = new GraphQLScalarType({
  name: 'JSON',
  description: 'A scalar type representing JSON values',
  serialize: value => value,
  parseValue: value => value,
  parseLiteral
})

module.exports = { GraphQLJSON }
