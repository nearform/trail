# @nearform/trail-hapi-plugin

[![npm][npm-badge]][npm-url]

trail-hapi-plugin is a plugin to add the trail REST API to a [Hapi][hapi] server.

## Install

To install via npm:

```
npm install @nearform/trail-hapi-plugin
```

## Usage

```javascript
const main = async function() {
  const server = require('hapi').Server({host: 'localhost', port: 80})

  await server.register([
    {
      plugin: require('@nearform/trail-hapi-plugin'),
    }
  ])

  await server.start()
  logMessage(`Server running at: ${server.info.uri}`)
}

main().catch(console.error)
```

Trails route will be then accessible on the `/trails` path.

For more information on the REST API, you can check the generated OpenAPI / Swagger JSON file, which will available at the `/trails/swagger.json` path.

## License

Copyright nearForm Ltd 2018. Licensed under [MIT][license].

[npm-url]: https://npmjs.org/package/@nearform/trail-hapi-plugin
[npm-badge]: https://badge.fury.io/js/@nearform/trail-hapi-plugin.svg
[hapi]: https://hapijs.com/
[license]: ./LICENSE.md
