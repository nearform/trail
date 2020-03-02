# @nearform/trail-fastify-graphql-plugin

[![npm][npm-badge]][npm-url]

trail-fastify-graphql-plugin is a [Fastify][fastify] plugin which adds a graphql endpoint for querying trail data.

## Install

To install via npm:

```
npm install @nearform/trail-fastify-graphql-plugin
```

## Usage

```javascript
const Fastify = require('fastify')

const main = async function() {
  const fastify = Fastify()

  fastify.register(require('@nearform/trail-fastify-graphql-plugin'))

  await fastify.listen(3000, console.log)
}

main().catch(console.error)
```

Graphql queries can then be submitted to the `/graphql` path as either GET or POST requests. If using a GET request then specify the query to be executed in a request parameter named `query`. If using a POST request then the query can be specified in the request body as either JSON or graphql. See the [fastify-gql][fastify-gql] module for details.

## Graphql schema

### Queries

The schema provides the following queries:

* `trail(id: Int!)`: Fetch a trail record by ID.
* `trails(from: Date!, to: Date!, ...)`: Search for trail records within a specified date range, and optionally filter by additional values.
* `enumerate(from: Date!, to: Date!, type: TrailType!, ...)`: Return an enumeration of trails of the specified type, within the specified date range.

### Mutations

The schema provides the following mutations:

* `insert(when: Date!, who: StringWithAttrs!, what: StringWithAttrs!, subject: StringWithAttrs!, where: JSON, why: JSON, meta: JSON)`: Insert a new trail record.
* `update(id: Int!, when: Date!, who: StringWithAttrs!, what: StringWithAttrs!, subject: StringWithAttrs!, where: JSON, why: JSON, meta: JSON)`: Update a trail record.
* `remove(id: Int!)`: Delete a trail record.

### String values

Some trail record fields support attributed string values (indicated by the `StringWithAttrs` type) when inserting or updating. When writing fields of this type, the value can be specified either as an object with an `id` property (specifying the string value) and additional properties which specify the string's attributes; or as a simple string value when no additional attributes are needed.

For example:

* String with attributes: `{ id: "the string", attr0: "this", attr1: 1 }`
* String with no attributes: `"the string"` - equivalent to `{ id: "the string" }`

## Sample queries

### Get a trail record

```graphql
{
    trail(id: 123) {
        id
        when
        subject
    }
}
```

### Search for trail records

```graphql
{
    trails(from: "2018-01-01T12:34:56.000Z", to: "2018-01-05T12:34:56.000Z") {
        id
        when
        who
        what
        subject
    }
}
```

### Enumerate trail records

```graphql
{
    enumerate(from: "2018-01-01T12:34:56.000Z", to: "2018-01-05T12:34:56.000Z", type: WHO)
}
```

### Insert a new trail record

```graphql
mutation {
    insert(when: "2018-01-01T12:34:56.000Z", who: "A Person", what: "A thing", subject: "Substance") {
        id
        when
        who
        what
        subject
        meta
        where
        why
    }
}
```

### Insert a new trail record with attributed strings

```graphql
mutation {
    insert(when: "2018-01-01T12:34:56.000Z", who: { id: "A Person", attr: 10 }, what: { id: "A thing", attr: 20 }, subject: "Substance") {
        id
        when
        who
        what
        subject
        meta
        where
        why
    }
}
```

### Update an existing trail record

```graphql
mutation {
    update(id: 123, when: "2018-01-01T12:34:56.000Z", who: "A N Other", what: "Something else", subject: "Object")
}
```

### Delete a trail record

```graphql
mutation {
    remove(id: 123)
}
```

## License

Copyright nearForm Ltd 2020. Licensed under [MIT][license].

[npm-url]: https://npmjs.org/package/@nearform/trail-fastify-plugin
[npm-badge]: https://img.shields.io/npm/v/@nearform/trail-fastify-plugin.svg
[fastify]: https://www.fastify.io/
[fastify-gql]: https://github.com/mcollina/fastify-gql
[license]: ./LICENSE.md
