# Hapi Server

`trail-hapi-server` is a ready to use Hapi server with the `trail-hapi-plugin` registered.

## Installation

To install via npm:

```
npm install @nearform/trail-hapi-server
```

### Database setup

[filename](_database.md ':include')

## Usage

```
npx trail-hapi-server
```

This will start a server on `localhost:8080`. 

Swagger documentation will be accessible at `http://localhost:8080/documentation/`.

## CLI commands

### trail-hapi-server

Starts the Trail server with given options:

```
npx trail-hapi-server [options]
```

##### Options

| Option                    | Environment variable     | Description                                                     | Default     |
|---------------------------|--------------------------|-----------------------------------------------------------------|-------------|
| `--httpHost <host>`       | `TRAIL_HTTP_HOST`        | The hostname the HTTP server is bound to                        | `localhost` |
| `--httpPort <port>`       | `TRAIL_HTTP_PORT`        | The port the HTTP server is bound to                            | `8080`      |
| `--dbName <name>`         | `TRAIL_DB_NAME`          | The name of the trail database                                  | `trails`    |
| `--dbHost <host>`         | `TRAIL_DB_HOST`          | The hostname for the trail database                             | `localhost` |
| `--dbPort <port>`         | `TRAIL_DB_PORT`          | The port number for the trail database                          | `5432`      |
| `--dbUsername <user>`     | `TRAIL_DB_USERNAME`      | The username for the trail database                             | `postgres`  |
| `--dbPassword <password>` | `TRAIL_DB_PASSWORD`      | The password for the trail database                             | `postgres`  |
| `--dbPoolsize <size>`     | `TRAIL_DB_POOL_SIZE`     | The size of the trail DB pool                                   | `10`        |
| `--dbTimeout <ms>`        | `TRAIL_DB_TIMEOUT`       | The trail database idle timeout, in milliseconds                | `30000`     |

Environment variables can also be defined using a `.env` file.

Command line options take precedence over environment variables.

##### Examples

```
npx trail-hapi-server --httpPort 80
TRAIL_DB_USERNAME=<username> TRAIL_DB_PASSWORD=<password> npx trail-hapi-server
```

[filename](_commands.md ':include')

## License

[filename](_license.md ':include')
