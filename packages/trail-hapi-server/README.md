# @nearform/trail-hapi-server

[![npm][npm-badge]][npm-url]

trail-hapi-server is a ready to use [Hapi][hapi] server with the trail-hapi-plugin registered.

It also provides a local instance of [Swagger UI][swagger-ui] to easily check the REST API documentation.

## Install

To install via npm:

```
npm install @nearform/trail-hapi-server
```

## Usage

```
npx run trail-hapi-server
```

This will start a server on `localhost:8080`. Swagger UI documentation is accessible at `http://localhost:8080/documentation`.

## Configuration

The server looks for the following environment variables:

*  `TRAIL_DB_HOST`: The hostname for the trail database.
*  `TRAIL_DB_PORT`: The port number for the trail database.
*  `TRAIL_DB_NAME`: The name of the trail database.
*  `TRAIL_DB_USERNAME`: The username for the trail database.
*  `TRAIL_DB_PASSWORD`: The password for the trail database.
*  `TRAIL_DB_POOL_SIZE`: The size of the trail DB pool.
*  `TRAIL_DB_TIMEOUT`: The trail database idle timeout, in milliseconds.
*  `TRAIL_HTTP_HOST`: The hostname the HTTP server is bound to.
*  `TRAIL_HTTP_PORT`: The port the HTTP server is bound to.
*  `TRAIL_LOG_LEVEL`: The logging level; defaults to `warn`.
*  `TRAIL_DISABLE_REST_API`: Switch indicating whether to disable the REST API.
*  `TRAIL_DISABLE_GRAPHQL`: Switch indicating whether to disable the graphql endpoint.

These can also be defined using a `.env` file.

The server also takes the following command line options:

*  `--dbHost <host>`: Set the database host name; defaults to `localhost`.
*  `--dbPort <port>`: Set the database port; defaults to `5432`.
*  `--dbName <name>`: Set the database name; defaults to `trails`.
*  `--dbUsername <user>`: Set the database username; defaults to `postgres`.
*  `--dbPassword <password>`: Set the database password; defaults to `postgres`.
*  `--dbPoolsize <size>`: Set the database pool size; defaults to `10`.
*  `--dbTimeout <ms>`: Set the database pool timeout, in milliseconds; defaults to `30000`.
*  `--httpHost <host>`: Set the HTTP hostname; defaults to `localhost`.
*  `--httpPort <port>`: Set the HTTP port; defaults to `8080`.
*  `--logLevel <level>: Set the logger level; defaults to `warn`.
*  `--noRESTAPI`: Switch to disable the REST API.
*  `--noGraphQL`: Switch to disable the graphQL endpoint.

Command line options take precedence over environment variable settings.

## License

Copyright nearForm Ltd 2018. Licensed under [MIT][license].

[npm-url]: https://npmjs.org/package/@nearform/trail-hapi-server
[npm-badge]: https://img.shields.io/npm/v/@nearform/trail-hapi-server.svg
[hapi]: https://hapijs.com/
[swagger-ui]: https://swagger.io/swagger-ui/
[license]: ./LICENSE.md
