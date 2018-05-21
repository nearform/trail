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

## License

Copyright nearForm Ltd 2018. Licensed under [MIT][license].

[npm-url]: https://npmjs.org/package/@nearform/trail-hapi-server
[npm-badge]: https://img.shields.io/npm/v/@nearform/trail-hapi-server.svg
[hapi]: https://hapijs.com/
[swagger-ui]: https://swagger.io/swagger-ui/
[license]: ./LICENSE.md
