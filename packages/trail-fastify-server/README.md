# @nearform/trail-fastify-server

[![npm][npm-badge]][npm-url]

trail-fastify-server is a ready to use [Fastify][fastify] server with the trail-fastify-plugin registered.

It also provides a local instance of [Swagger UI][swagger-ui] to easily check the REST API documentation.

## Install

To install via npm:

```
npm install @nearform/trail-fastify-server
```

## Usage

```
npx run trail-fastify-server
```

This will start a server on `localhost:8080`. Swagger UI documentation is accessible at `http://localhost:8080/documentation`.

## Configuration

The server looks for the following environment variables:

*   `TRAIL_DB_HOST`: The hostname for the trail database.
*   `TRAIL_DB_PORT`: The port number for the trail database.
*   `TRAIL_DB_NAME`: The name of the trail database.
*   `TRAIL_DB_USERNAME`: The username for the trail database.
*   `TRAIL_DB_PASSWORD`: The password for the trail database.
*   `TRAIL_DB_POOL_SIZE`: The size of the trail DB pool.
*   `TRAIL_DB_TIMEOUT`: The trail database idle timeout, in milliseconds.
*   `TRAIL_HTTP_HOST`: The hostname the HTTP server is bound to.
*   `TRAIL_HTTP_PORT`: The port the HTTP server is bound to.
*   `TRAIL_DISABLE_REST_API`: Switch indicating whether to disable the REST API.
*   `TRAIL_DISABLE_GRAPHQL`: Switch indicating whether to disable the graphql endpoint.

These can also be defined using a `.env` file.

The server also takes the following command line options:

*   `--dbHost <host>`: The hostname for the trail database. Defaults to `localhost`.
*   `--dbPort <port>`: The port number for the trail database. Defaults to `5432`.
*   `--dbName <name>`: The name of the trail database. Defaults to `trails`.
*   `--dbUsername <user>`: The username for the trail database. Defaults to `postgres`.
*   `--dbPassword <password>`: The password for the trail database. Defaults to `postgres`.
*   `--dbPoolsize <size>`: The size of the trail DB pool. Defaults to `10`.
*   `--dbTimeout <ms>`: The trail database idle timeout, in milliseconds. Defaults to `30000`.
*   `--httpHost <host>`: The hostname the HTTP server is bound to. Defaults to `localhost`.
*   `--httpPort <port>`: The port the HTTP server is bound to. Defaults to `8080`.
*   `--noRESTAPI`: Switch indicating whether to disable the Trail's REST API. Defaults to `false`.
*   `--noGraphql`: Switch indicating whether to disable the graphql query endpoint. Defaults to `false`.

Command line options take precedence over environment settings.

## License

Copyright nearForm Ltd 2020. Licensed under [MIT][license].

[npm-url]: https://npmjs.org/package/@nearform/trail-fastify-server
[npm-badge]: https://img.shields.io/npm/v/@nearform/trail-fastify-server.svg
[fastify]: https://www.fastify.io/
[swagger-ui]: https://swagger.io/swagger-ui/
[license]: ./LICENSE.md
