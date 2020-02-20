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

## License

Copyright nearForm Ltd 2020. Licensed under [MIT][license].

[npm-url]: https://npmjs.org/package/@nearform/trail-fastify-server
[npm-badge]: https://img.shields.io/npm/v/@nearform/trail-fastify-server.svg
[fastify]: https://www.fastify.io/
[swagger-ui]: https://swagger.io/swagger-ui/
[license]: ./LICENSE.md
