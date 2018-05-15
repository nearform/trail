# Trail

[![travis][travis-badge]][travis-url]
[![coveralls][coveralls-badge]][coveralls-url]

Trail is a audit trail log service. It supports logging all kind of actions with a flexible model scheme.

For information about the model scheme, see the [trail-core package README][trail-core-readme].
This repository is home to Trail's three main modules:

| Module                                            | Package                                                             |
| ------                                            | -------                                                             |
| [@nearform/trail-core][trail-core]                | [./packages/trail-core](./packages/trail-core)                      |
| [@nearform/trail-hapi-plugin][trail-hapi-plugin]  | [./packages/trail-hapi-plugin](./packages/trail-hapi-plugin)        |
| [@nearform/trail-hapi-server][trail-hapi-server]  | [./packages/trail-hapi-server](./packages/trail-hapi-server)        |

### Node.js support

Trail requires [Node.js][node] 8.9.0+.

The [Hapi][hapi] plugin and server packages require Hapi 17+.

### Database support

Trail requires an instance of Postgres (version 9.5+) to function correctly. For simplicity, a preconfigured `docker-compose` file has been provided. To run:

```
docker-compose up
```

-   **Note:** Ensure you are using the latest version of Docker for (Linux/OSX/Windows)
-   **Note:** Trails needs PostgreSQL >= 9.5

#### Populate the database

The initial tables can be created by executing:

```
npm run pg:init
```

### pgAdmin database access
As the Postgresql docker container has its 5432 port forwarded on the local machine the database can be accessed with pgAdmin.

To access the database using the pgAdmin you have to fill in also the container IP beside the database names and access credentials. The container IP can be seen with `docker ps`.  Use IP 127.0.0.1 and use postgres as username/password to connect to database server.

### Migrations
We use [`postgrator`][postgrator] for database migrations. You can find the sql files in the [`packages/trail-core/database/migrations`](https://github.com/nearform/trail/tree/master/packages/trail-core/database/migrations) folder. To run the migrations manually:

```
node packages/trail-core/database/migrate.js --version=<version>`
```

**Note:** Running the tests or init commands will automaticaly bring the db to the latest version.

### Swagger API Documentation

The Swagger API documentation can be accessed from trail itself. Simply start the server:

```
npm run start
```

and then go to [`http://localhost:8080/documentation`][swagger-link]

The Swagger documentation also gives the ability to execute calls to the API and see their results.

### ENV variables to set configuration options

Each package uses a default configuration file and then a environment (the value of the `NODE_ENV` environment variable, with a default of `development`) configuration file.

If you put a file named after the enviroment in the `config` folder of the current working directory, it will be parsed and it will override any existing setting.

To get started, look at the files defined in the `config` folder of each package.

## Testing, benching & linting

Before running tests, ensure a valid Postgres database is running. The simplest way to do this is via Docker. Assuming docker is installed on your machine, in the root folder, run:

```
docker-compose up -d
```

This will start a Postgres database. Running test or coverage runs will automatically populate the database with the information it needs.

**Note:** you can tail the Postgres logs if needed with `docker-compose logs --tail=100 -f`

To run tests:

```
npm run test
```

**Note:** running the tests will output duplicate keys errors in Postgres logs, this is expected, as the error handling of those cases is part of what is tested.

To lint the repository:

```
npm run lint
```

To fix (most) linting issues:

```
npm run lint -- --fix
```

To create coverage reports:

```
npm run coverage
```

## License

Copyright nearForm Ltd 2018. Licensed under [MIT][license].

[travis-badge]: https://travis-ci.org/nearform/trail-hapi-plugin.svg?branch=master
[travis-url]: https://travis-ci.org/nearform/trail-hapi-plugin
[coveralls-badge]: https://coveralls.io/repos/nearform/trail-hapi-plugin/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/nearform/trail-hapi-plugin?branch=master
[trail-core]: https://www.npmjs.com/package/@nearform/trail-core
[trail-hapi-plugin]: https://www.npmjs.com/package/trail/@nearform/trail-hapi-plugin
[trail-hapi-server]: https://www.npmjs.com/package/trail/@nearform/trail-hapi-server
[trail-core-readme]: ./packages/trail-core/README.md
[node]: https://nodejs.org/it/
[hapi]: https://hapijs.com/
[postgrator]: https://github.com/rickbergfalk/postgrator
[swagger-link]: http://localhost:8080/documentation
[license]: ./LICENSE.md
