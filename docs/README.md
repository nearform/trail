# Trail

Trail is a modular and flexible **audit trail log service**. 

## Features

* Run as stand-alone server or extend existing service
* **Postgres** backend with **flexible schema**
* **REST** and **GraphQL** interfaces
* Support for **Fastify** and **Hapi** frameworks

## Requirements

* Node.js 12.0.0+
* Postgres 9.5+
* The Hapi plugin and server packages require Hapi 19+

## Quick start

1. Install Trail server (Fastify or Hapi) via npm:

    ```
    npm install @nearform/trail-fastify-server
    ```

2. Start Postgres and create database with required tables:

    ```
    docker-compose --file node_modules/@nearform/trail-core/docker-compose.yml up --detach
    npx trail-database-init
    npx trail-database-migrate --version=max
    ```

3. Start Trail server:

    ```
    npx trail-fastify-server
    ```

4. Create your first audit record:

    ```javascript
    const response = await fetch('http://localhost:8080/trails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            when: "2020-03-31T16:02:27.023Z",
            who: 'user-id',
            what: 'order-canceled',
            subject: 'order-number'
        })
    });
    ```

## Setup Trail server

Before being able to create an audit trail you need to setup an instance of the Trail server with accompanying database.

### Run as stand-alone server

You can run Trail as a standalone server using Fastify or Hapi:

* [`@nearform/trail-fastify-server`](/trail-fastify-server.md) — Ready to use Trail server using Fastify framework
* [`@nearform/trail-hapi-server`](/trail-hapi-server.md) — Ready to use Trail server using Hapi framework

See the respective module documentation for details on how to set this up.

### Extend existing service

Alternatively you can add Trail endpoints to an existing Fastify or Hapi service using the plugins provided:

* [`@nearform/trail-fastify-plugin`](/trail-fastify-plugin.md) — Fastify plugin that exposes the Trail REST API
* [`@nearform/trail-fastify-graphql-plugin`](/trail-fastify-graphql-plugin.md) — Fastify plugin that exposes the Trail GraphQL endpoint
* [`@nearform/trail-hapi-plugin`](/trail-hapi-plugin.md) — Hapi plugin that exposes the Trail REST API

See the respective module documentation for details on how to set this up.

## Integrate Trail

Once your Trail server is running you can integrate it using REST or GraphQL.

### REST API

[filename](_rest-api.md ':include')

### GraphQL API

[filename](_graphql-api.md ':include')

## License

[filename](_license.md ':include')
