-   [`GET /trails`](#search-audit-trails) — Search audit trails
-   [`POST /trails`](#create-a-new-audit-trail) — Create a new audit trail
-   [`GET /trails/:id`](#get-an-audit-trail) — Get an audit trail
-   [`PUT /trails/:id`](#update-an-audit-trail) — Update an audit trail
-   [`DELETE /trails/:id`](#delete-an-audit-trail) — Delete an audit trail
-   [`GET /trails/enumerate`](#enumerate-audit-trails-ids) — Enumerate audit trails ids

The Swagger API documentation can be accessed from Trail itself: `http://localhost:8080/documentation/`

#### Search audit trails

`GET /trails`

##### Query Parameters

| Name     | Type              | Required | Description                                                                                                                                                                                                            |
| -------- | ----------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| from     | string(date-time) | true     | The minimum timestamp (inclusive)                                                                                                                                                                                      |
| to       | string(date-time) | true     | The maximum timestamp (inclusive)                                                                                                                                                                                      |
| who      | string            | false    | A portion of the trail actor id                                                                                                                                                                                        |
| what     | string            | false    | A portion of the trail subject id                                                                                                                                                                                      |
| subject  | string            | false    | A portion of the trail target id                                                                                                                                                                                       |
| page     | number            | false    | The page of results to return (first page is 1)                                                                                                                                                                        |
| pageSize | number            | false    | The number of results per page (default is 25)                                                                                                                                                                         |
| sort     | string            | false    | The field to use for sorting results. Default order is ascending, which can be reversed by prepending a dash. Possible values are: when, id, who, what, subject, -when, -id, -who, -what, -subject. Default is "-when" |

##### Responses

| Status | Meaning                                                                    | Description                                                      | Schema                                                    |
| ------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)                    | The search results.                                              | Inline                                                    |
| 422    | [Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)   | Error returned when the input payload is not a valid trail.      | [#/components/errors/422](#schema#/components/errors/422) |
| 500    | [Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error returned when a unexpected error was thrown by the server. | [#/components/errors/500](#schema#/components/errors/500) |

> 200 Response

```json
[
  {
    "id": 12345,
    "when": "2018-01-02T03:04:05.123Z",
    "who": {
      "id": "Trail actor"
    },
    "what": {
      "id": "Trail subject"
    },
    "subject": {
      "id": "Trail target"
    },
    "where": {},
    "why": {},
    "meta": {}
  }
]
```

#### Create a new audit trail

`POST /trails`

##### Request body

```json
{
  "when": "2018-01-02T03:04:05.123Z",
  "who": {
    "id": "Trail actor"
  },
  "what": {
    "id": "Trail subject"
  },
  "subject": {
    "id": "Trail target"
  },
  "where": {},
  "why": {},
  "meta": {}
}
```

##### Responses

| Status | Meaning                                                                    | Description                                                      | Schema                                                                          |
| ------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 201    | [Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)               | A audit trail                                                    | [#/components/models/trail.response](#schema#/components/models/trail.response) |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)           | Error returned when the input payload is not a valid JSON.       | [#/components/errors/400](#schema#/components/errors/400)                       |
| 422    | [Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)   | Error returned when the input payload is not a valid trail.      | [#/components/errors/422](#schema#/components/errors/422)                       |
| 500    | [Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error returned when a unexpected error was thrown by the server. | [#/components/errors/500](#schema#/components/errors/500)                       |

> 201 Response

```json
{
  "id": 12345,
  "when": "2018-01-02T03:04:05.123Z",
  "who": {
    "id": "Trail actor"
  },
  "what": {
    "id": "Trail subject"
  },
  "subject": {
    "id": "Trail target"
  },
  "where": {},
  "why": {},
  "meta": {}
}
```

#### Get an audit trail

`GET /trails/:id`

##### Parameters

| Name | In   | Type                                                                              | Required | Description |
| ---- | ---- | --------------------------------------------------------------------------------- | -------- | ----------- |
| id   | path | [#/components/models/trail.params.id](#schema#/components/models/trail.params.id) | true     | Trail id    |

> 200 Response

```json
{
  "id": 12345,
  "when": "2018-01-02T03:04:05.123Z",
  "who": {
    "id": "Trail actor"
  },
  "what": {
    "id": "Trail subject"
  },
  "subject": {
    "id": "Trail target"
  },
  "where": {},
  "why": {},
  "meta": {}
}
```

##### Responses

| Status | Meaning                                                                    | Description                                                      | Schema                                                                          |
| ------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)                    | A audit trail                                                    | [#/components/models/trail.response](#schema#/components/models/trail.response) |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)           | Error returned when the input payload is not a valid JSON.       | [#/components/errors/400](#schema#/components/errors/400)                       |
| 404    | [Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)             | Error returned when a requested resource could not be found.     | [#/components/errors/404](#schema#/components/errors/404)                       |
| 500    | [Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error returned when a unexpected error was thrown by the server. | [#/components/errors/500](#schema#/components/errors/500)                       |

#### Update an audit trail

`PUT /trails/:id`

##### Body parameter

```json
{
  "when": "2018-01-02T03:04:05.123Z",
  "who": {
    "id": "Trail actor"
  },
  "what": {
    "id": "Trail subject"
  },
  "subject": {
    "id": "Trail target"
  },
  "where": {},
  "why": {},
  "meta": {}
}
```

##### Responses

| Status | Meaning                                                                    | Description                                                      | Schema                                                                          |
| ------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 202    | [Accepted](https://tools.ietf.org/html/rfc7231#section-6.3.3)              | A audit trail                                                    | [#/components/models/trail.response](#schema#/components/models/trail.response) |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)           | Error returned when the input payload is not a valid JSON.       | [#/components/errors/400](#schema#/components/errors/400)                       |
| 404    | [Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)             | Error returned when a requested resource could not be found.     | [#/components/errors/404](#schema#/components/errors/404)                       |
| 422    | [Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)   | Error returned when the input payload is not a valid trail.      | [#/components/errors/422](#schema#/components/errors/422)                       |
| 500    | [Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error returned when a unexpected error was thrown by the server. | [#/components/errors/500](#schema#/components/errors/500)                       |

> 202 Response

```json
{
  "id": 12345,
  "when": "2018-01-02T03:04:05.123Z",
  "who": {
    "id": "Trail actor"
  },
  "what": {
    "id": "Trail subject"
  },
  "subject": {
    "id": "Trail target"
  },
  "where": {},
  "why": {},
  "meta": {}
}
```

#### Delete an audit trail

`DELETE /trails/:id`

##### Responses

| Status | Meaning                                                                    | Description                                                      | Schema                                                    |
| ------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| 204    | [No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)            | The trail has been deleted successfully.                         | None                                                      |
| 400    | [Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)           | Error returned when the input payload is not a valid JSON.       | [#/components/errors/400](#schema#/components/errors/400) |
| 404    | [Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)             | Error returned when a requested resource could not be found.     | [#/components/errors/404](#schema#/components/errors/404) |
| 500    | [Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error returned when a unexpected error was thrown by the server. | [#/components/errors/500](#schema#/components/errors/500) |

> 400 Response

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Only JSON payloads are accepted. Please set the \"Content-Type\" header to start with \"application/json\"."
}
```

#### Enumerate audit trails ids

`GET /trails/enumerate`

##### Parameters

| Name     | In    | Type              | Required | Description                                     |
| -------- | ----- | ----------------- | -------- | ----------------------------------------------- |
| from     | query | string(date-time) | true     | The minimum timestamp (inclusive)               |
| to       | query | string(date-time) | true     | The maximum timestamp (inclusive)               |
| type     | query | string            | true     | The type of id to search                        |
| page     | query | number            | false    | The page of results to return (first page is 1) |
| pageSize | query | number            | false    | The number of results per page (default is 25)  |
| desc     | query | boolean           | false    | If to sort alphabetically by descending order   |

##### Enumerated Values

| Parameter | Value   |
| --------- | ------- |
| type      | who     |
| type      | what    |
| type      | subject |

##### Responses

| Status | Meaning                                                                    | Description                                                      | Schema                                                    |
| ------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| 200    | [OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)                    | The enumeration results.                                         | Inline                                                    |
| 422    | [Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)   | Error returned when the input payload is not a valid trail.      | [#/components/errors/422](#schema#/components/errors/422) |
| 500    | [Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error returned when a unexpected error was thrown by the server. | [#/components/errors/500](#schema#/components/errors/500) |

> 200 Response

```json
[
  "string"
]
```
