Trail requires an instance of Postgres to function correctly. You can use your own instance or run the pre-configured docker compose file:

```
docker-compose --file node_modules/@nearform/trail-core/docker-compose.yml up --detach
```

-   **Note:** Ensure you are using the latest version of Docker for (Linux/OSX/Windows)
-   **Note:** Trails needs PostgreSQL >= 9.5

Once Postgres has started you can create the database with the required tables using:

```
npx trail-database-init
npx trail-database-migrate --version=max
```
