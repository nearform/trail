# Fastify Plugin

`trail-fastify-graphql-plugin` is a plugin to add the trail GraphQL API to a Fastify server.

## Installation

To install via npm:

    npm install @nearform/trail-fastify-graphql-plugin

### Database setup

[filename](_database.md ':include')

## Usage

```javascript
const Fastify = require('fastify')

const main = async function() {
  const fastify = Fastify()

  fastify.register(require('@nearform/trail-fastify-graphql-plugin'))

  await fastify.listen(3000, console.log)
}

main().catch(console.error)
```

Trails route will be then accessible on the `/trails` path.

For more information on the REST API, you can check the generated OpenAPI / Swagger JSON file, which will available at the `/trails/swagger.json` path.

## Configuration

The plugin takes the following configuration options:

-   `logger`: A logger to be passed to the trails manager.
-   `db`: Database settings for the trails manager.
-   `pool`: A pre-configured database pool to be used by the trails manager; used in preference to any specified database settings.
-   `trailsManager`: A pre-configured trails manager instance; used in preference to any of the previous settings.

## License

[filename](_license.md ':include')
