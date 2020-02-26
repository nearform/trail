# @nearform/trail-fastify-plugin

[![npm][npm-badge]][npm-url]

trail-fastify-plugin is a plugin to add the trail REST API to a [Fastify][fastify] server.

## Install

To install via npm:

```
npm install @nearform/trail-fastify-plugin
```

## Usage

```javascript
const Fastify = require('fastify')

const main = async function() {
  const fastify = Fastify()

  fastify.register(require('@nearform/trail-fastify-plugin'))

  await fastify.listen(3000, console.log)
}

main().catch(console.error)
```

Trails route will be then accessible on the `/trails` path.

For more information on the REST API, you can check the generated OpenAPI / Swagger JSON file, which will available at the `/trails/swagger.json` path.

## License

Copyright nearForm Ltd 2020. Licensed under [MIT][license].

[npm-url]: https://npmjs.org/package/@nearform/trail-fastify-plugin
[npm-badge]: https://img.shields.io/npm/v/@nearform/trail-fastify-plugin.svg
[fastify]: https://www.fastify.io/
[license]: ./LICENSE.md
