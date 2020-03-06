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

  * `TRAIL_DB_HOST`: The hostname for the trail database.
  * `TRAIL_DB_PORT`: The port number for the trail database.
  * `TRAIL_DB_NAME`: The name of the trail database.
  * `TRAIL_DB_USERNAME`: The username for the trail database.
  * `TRAIL_DB_PASSWORD`: The password for the trail database.
  * `TRAIL_DB_POOL_SIZE`: The size of the trail DB pool.
  * `TRAIL_DB_TIMEOUT`: The trail database idle tieout, in milliseconds.
  * `TRAIL_HTTP_HOST`: The hostname the HTTP server is bound to.
  * `TRAIL_HTTP_PORT`: The port the HTTP server is bound to.
  * `TRAIL_USE_REST_API`: Flag indicating whether to mount the REST API.
  * `TRAIL_USE_GRAPHQL`: Flag indicating whether to mount the graphql endpoint.

The server also takes the following command line options:

  * `--dbHost`: The hostname for the trail database.
  * `--dbPort`: The port number for the trail database.
  * `--dbName`: The name of the trail database.
  * `--dbUsername`: The username for the trail database.
  * `--dbPassword`: The password for the trail database.
  * `--dbPoolsize`: The size of the trail DB pool.
  * `--dbTimeout`: The trail database idle tieout, in milliseconds.
  * `--httpHost`: The hostname the HTTP server is bound to.
  * `--httpPort`: The port the HTTP server is bound to.
  * `--useRESTAPI`: Flag indicating whether to start with the Trail's REST API. Defaults to `true`.
  * `--useGraphql`: Flag indicating whether to start with the graphql query endpoint. Defaults to `true`.

## License

Copyright nearForm Ltd 2020. Licensed under [MIT][license].

[npm-url]: https://npmjs.org/package/@nearform/trail-fastify-server
[npm-badge]: https://img.shields.io/npm/v/@nearform/trail-fastify-server.svg
[fastify]: https://www.fastify.io/
[swagger-ui]: https://swagger.io/swagger-ui/
[license]: ./LICENSE.md
