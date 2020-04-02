### trail-database-init

Creates the Trail database:

```
npx trail-database-init [options]
```

#### Options

| Option                    | Environment variable     | Description                            | Default     |
|---------------------------|--------------------------|----------------------------------------|-------------|
| `--dbName <name>`         | `TRAIL_DB_NAME`          | The name of the trail database         | `trails`    |
| `--dbHost <host>`         | `TRAIL_DB_HOST`          | The hostname for the trail database    | `localhost` |
| `--dbPort <port>`         | `TRAIL_DB_PORT`          | The port number for the trail database | `5432`      |
| `--dbUsername <user>`     | `TRAIL_DB_USERNAME`      | The username for the trail database    | `postgres`  |
| `--dbPassword <password>` | `TRAIL_DB_PASSWORD`      | The password for the trail database    | `postgres`  |

**Note:** Command line options take precedence over environment variables.

#### Usage

```
npx trail-database-init --dbName <name>
TRAIL_DB_USERNAME=<username> TRAIL_DB_PASSWORD=<password> npx trail-database-init
```

### trail-database-migrate

Creates required tables for given Trail version or migrates from one version to the other:

```
npx trail-database-migrate [options]
```

#### Options

| Option                    | Environment variable     | Description                            | Default     |
|---------------------------|--------------------------|----------------------------------------|-------------|
| `--version <number>`      | `TRAIL_MIGRATE_VERSION`  | The database version to migrate to     | *none*      |
| `--dbName <name>`         | `TRAIL_DB_NAME`          | The name of the trail database         | `trails`    |
| `--dbHost <host>`         | `TRAIL_DB_HOST`          | The hostname for the trail database    | `localhost` |
| `--dbPort <port>`         | `TRAIL_DB_PORT`          | The port number for the trail database | `5432`      |
| `--dbUsername <user>`     | `TRAIL_DB_USERNAME`      | The username for the trail database    | `postgres`  |
| `--dbPassword <password>` | `TRAIL_DB_PASSWORD`      | The password for the trail database    | `postgres`  |

**Note:** Command line options take precedence over environment variables.

#### Usage

```
npx trail-database-migrate --version max
TRAIL_DB_USERNAME=<username> TRAIL_DB_PASSWORD=<password> npx trail-database-migrate --version 1
```
