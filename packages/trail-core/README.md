# @nearform/trail-core

[![npm][npm-badge]][npm-url]

trail-core is the core package. It is responsible for manipulating audit trails entries.

## Install

To install via npm:

```
npm install @nearform/trail-core
```

Trail requires an instance of Postgres (version 9.5+) to function correctly. For simplicity, a preconfigured `docker-compose` file has been provided:

```
docker-compose up
```

The initial tables can be created by executing:

```
npx trail-database-init --dbName=trails_test
```

## Usage

```javascript
const { TrailsManager } = require('@nearform/trail')

const main = async function() {
  const manager = new TrailsManager()

  const id = await manager.insert({
    when: '2018-05-01T12:00:00.123',
    who: 'user:1',
    what: 'open',
    subject: 'page:1',
  })
  const trail = await manager.get(id)
  console.log(trail.who)

  await manager.close()
}

main().catch(console.error)
```

## Configuration options

The following configuration options can be passed to the `TrailsManager` constructor:

*   `logger`: A logger (e.g. pino instance).
*   `db`: Database pool configuration settings. Can include any of the following:
    *   `host`: The database host; defaults to `localhost`.
    *   `port`: The database port; defaults to `5432`.
    *   `database`: The database name; defaults to `trails`.
    *   `user`: The database username; defaults to `postgres`.
    *   `password`: The database password; defaults to `postgres`.
    *   `max`: The maximum pool size; defaults to `10`.
    *   `idleTimeoutMillis`: The timeout period; defaults to `30000`.

## The trail object

The trail object is a plain object with the following attributes:

*   `when`: **MANDATORY** - A timestamp. When writing, it can be a Javascript date, a string in the [RFC3339][rfc3339] (basically ISO8601) format or a [luxon][luxon] DateTime. In all case, the timestamp is converted to UTC timezone. When reading, a UTC luxon DateTime will be returned.
*   `who`: **MANDATORY** - The actor who performed the action. See below for the description of its type.
*   `what`: **MANDATORY** - The action that was performed. See below for the description of its type.
*   `subject`: **MANDATORY** - The subject the action was performed on. See below for the description of its type.
*   `where`: A optional object describing the location where the action was performed.
*   `why`: A optional object describing the reason why the action was performed.
*   `meta`: Additional metadata for this trail.

The `who`, `what` and `subject` attributes are objects containing at least the `id` string attribute. When creating or updating a record, you can specify just a string.
It will be automatically converted to a object containing only the `id` attribute.

## API

### `async TrailsManager.insert(trail)`

Inserts a new trail in the database.

Returns the newly trail id.

### `async TrailsManager.get(id)`

Fetches a trail from the database.

Returns the requested trail or `null`.

### `async TrailsManager.update(id, trail)`

Replaces a trail in the database.

Note that partial updates are not supported, which means that the record will be completed replaced.

Returns `true` if the record was found and updated, `false` otherwise.

### `async TrailsManager.delete(id)`

Deletes a trail from the database.

Returns `true` if the record was found and deleted, `false` otherwise.

### `async TrailsManager.search({from, to, who, what, subject, page, pageSize, sort, exactMatch, caseInsensitive})`

Searchs for trails in the database.

The `from` and `to` attributes follow the same rule of the `when` trail attributes and are inclusive.

The `who`, `what` and `subject` attributes must be string and can be used to search inside the `id` attributes of the respective trail attributes.
You can use `exactMatch` (default to `false`) to match only trails which `id` is exactly the searched value.
You can use `caseInsensitive` (default to `false`) to ignore case when matching values.

The `page` and `pageSize` attributes can be used to control pagination. They must be positive numbers. The default pageSize is 25.

To sort results, use the `sort` attribute. It supports sorting by the `id`, `when`, `who`, `what` and `subject` attributes.
The default sort direction is ascending, but it can be reversed by prepending a dash. (i.e: `-who`). The default value is `-when`.

Returns an array of found trail objects.

### `async TrailsManager.enumerate({from, to, type, page, pageSize, desc})`

Searchs for distinct ids in the database.

The `from` and `to` attributes follow the same rule of the `when` trail attributes and are inclusive.

The `type` must be one of the following values: `who`, `what` or `subject`.

The `page` and `pageSize` attributes can be used to control pagination. They must be positive numbers. The default pageSize is 25.

The `desc` can be set to `true` to sort results by descending order.

Returns an array of found id (depending on the `type` attribute), ordered alphabetically.

## CLI

### `trail-database-init`

Command used to create initial tables required by Trail.

```
npx trail-database-init
```

* `--dbHost` (default: 'localhost') - Postgres hostname (or use `TRAIL_DB_HOST` env variable)
* `--dbPort` (default: 5432) - Postgres port (or use `TRAIL_DB_PORT` env variable)
* `--dbUsername` (default: 'postgres') - Postgres username (or use `TRAIL_DB_USERNAME` env variable)
* `--dbPassword` (default: 'postgres') - Postgres password (or use `TRAIL_DB_PASSWORD` env variable)
* `--dbName` (default: 'trails') - Trail database name (or use `TRAIL_DB_NAME` env variable)

### `trail-database-migrate`

Command used to run any database migrations manually.

```
npx trail-database-migrate --version=<version>
```

* `--version` - Migration version (or use `TRAIL_MIGRATE_VERSION` env variable)
* `--dbHost` (default: 'localhost') - Postgres hostname (or use `TRAIL_DB_HOST` env variable)
* `--dbPort` (default: 5432) - Postgres port (or use `TRAIL_DB_PORT` env variable)
* `--dbUsername` (default: 'postgres') - Postgres username (or use `TRAIL_DB_USERNAME` env variable)
* `--dbPassword` (default: 'postgres') - Postgres password (or use `TRAIL_DB_PASSWORD` env variable)
* `--dbName` (default: 'trails') - Trail database name (or use `TRAIL_DB_NAME` env variable)

## License

Copyright nearForm Ltd 2018. Licensed under [MIT][license].

[npm-url]: https://npmjs.org/package/@nearform/trail-core
[npm-badge]: https://img.shields.io/npm/v/@nearform/trail-core.svg
[luxon]: https://moment.github.io/luxon/
[rfc3339]: https://tools.ietf.org/html/rfc3339
[license]: ./LICENSE.md
