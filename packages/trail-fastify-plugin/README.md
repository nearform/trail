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

## Configuration

The plugin takes the following configuration options:

  * `logger`: A logger to be passed to the trails manager.
  * `db`: Database settings for the trails manager.
  * `pool`: A pre-configured database pool to be used by the trails manager; used in preference to any specified database settings.
  * `trailsManager`: A pre-configured trails manager instance; used in preference to any of the previous settings.

## License

Copyright nearForm Ltd 2020. Licensed under [MIT][license].

[npm-url]: https://npmjs.org/package/@nearform/trail-fastify-plugin
[npm-badge]: https://img.shields.io/npm/v/@nearform/trail-fastify-plugin.svg
[fastify]: https://www.fastify.io/
[license]: ./LICENSE.md
