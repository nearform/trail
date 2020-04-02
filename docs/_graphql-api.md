#### Queries

-   `trail(id: Int!)` — Fetch a trail record by ID.
-   `trails(from: Date!, to: Date!, ...)` — Search for trail records within a specified date range, and optionally filter by additional values.
-   `enumerateTrails(from: Date!, to: Date!, type: TrailType!, ...)` — Return an enumeration of trails of the specified type, within the specified date range.

#### Mutations

-   `insertTrail(when: Date!, who: StringWithAttrs!, what: StringWithAttrs!, subject: StringWithAttrs!, where: JSON, why: JSON, meta: JSON)` — Insert a new trail record.
-   `updateTrail(id: Int!, when: Date!, who: StringWithAttrs!, what: StringWithAttrs!, subject: StringWithAttrs!, where: JSON, why: JSON, meta: JSON)` — Update a trail record.
-   `deleteTrail(id: Int!)` — Delete a trail record.

##### String values

Some trail record fields support attributed string values (indicated by the `StringWithAttrs` type) when inserting or updating. 

When writing fields of this type, the value can be specified either as an object with an `id` property (specifying the string value) and additional properties which specify the string's attributes; or as a simple string value when no additional attributes are needed:

-   String with attributes: `{ id: "the string", attr0: "this", attr1: 1 }`
-   String with no attributes: `"the string"` - equivalent to `{ id: "the string" }`

#### Usage

##### Get a trail record

```graphql
{
    trail(id: 123) {
        id
        when
        subject
    }
}
```

##### Search for trail records

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

##### Enumerate trail records

```graphql
{
    enumerateTrails(from: "2018-01-01T12:34:56.000Z", to: "2018-01-05T12:34:56.000Z", type: WHO)
}
```

##### Insert a new trail record

```graphql
mutation {
    insertTrail(when: "2018-01-01T12:34:56.000Z", who: "A Person", what: "A thing", subject: "Substance") {
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

##### Insert a new trail record with attributed strings

```graphql
mutation {
    insertTrail(when: "2018-01-01T12:34:56.000Z", who: { id: "A Person", attr: 10 }, what: { id: "A thing", attr: 20 }, subject: "Substance") {
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

##### Update an existing trail record

```graphql
mutation {
    updateTrail(id: 123, when: "2018-01-01T12:34:56.000Z", who: "A N Other", what: "Something else", subject: "Object")
}
```

##### Delete a trail record

```graphql
mutation {
    deleteTrail(id: 123)
}
```
