<h1>Tymber framework</h1>

Tymber is a batteries-included framework for building TypeScript applications.

**Table of contents**

<!-- TOC -->
  * [Features](#features)
  * [Getting started](#getting-started)
    * [Bun](#bun)
      * [Installation](#installation)
      * [Usage](#usage)
    * [Node.js](#nodejs)
      * [Installation](#installation-1)
      * [Usage](#usage-1)
  * [File structure](#file-structure)
  * [Packages](#packages)
  * [License](#license)
<!-- TOC -->

## Features

- modular structure
- dependency injection
- security (CSRF, CORS)
- database migrations
- internationalization (i18n)
- admin dashboard
- user management

With built-in:

- SQL query builder
- template engine

And minimal dependencies:

| Dependencies                                                                                            | Description                   |
|---------------------------------------------------------------------------------------------------------|-------------------------------|
| [`ajv`](https://www.npmjs.com/package/ajv) & [`ajv-formats`](https://www.npmjs.com/package/ajv-formats) | For validation                |
| [`argon2`](https://www.npmjs.com/package/argon2)                                                        | For password hashing          |
| [`pg`](https://www.npmjs.com/package/pg) & [`@types/pg`](https://www.npmjs.com/package/@types/pg)       | Only with PostgreSQL database |
| [`sqlite`](https://www.npmjs.com/package/sqlite) & [`sqlite3`](https://www.npmjs.com/package/sqlite3)   | Only with SQLite database     |

## Getting started

### Bun

#### Installation

```
bun add @tymber/common @tymber/core @tymber/postgres pg
```

#### Usage

```ts
import * as pg from "pg";
import { PostgresDB } from "@tymber/postgres";
import { App } from "@tymber/common";
import { CoreModule } from "@tymber/core";

const pgPool = new pg.Pool({
  user: "postgres",
  password: "changeit",
});

const db = new PostgresDB(pgPool);

const app = await App.create(db, [
  CoreModule
]);

export default {
  port: 8080,
  fetch: app.fetch,
};
```

### Node.js

#### Installation

```
npm i @tymber/common @tymber/core @tymber/postgres pg
```

#### Usage

```ts
import * as pg from "pg";
import { PostgresDB } from "@tymber/postgres";
import { App, toNodeHandler } from "@tymber/common";
import { CoreModule } from "@tymber/core";
import { createServer } from "node:http";

const pgPool = new pg.Pool({
  user: "postgres",
  password: "changeit",
});

const db = new PostgresDB(pgPool);

const app = await App.create(db, [
  CoreModule
]);

const httpServer = createServer(toNodeHandler(app.fetch));

httpServer.listen(8080);
```

## File structure

Each module has the following structure:

```
├── assets
│   ├── i18n
│   ├── migrations
│   ├── static
│   └── templates
├── src
│   ├── admin-endpoints
│   ├── admin-view
│   ├── repositories
│   ├── services
│   ├── user-endpoints
│   ├── user-views
│   └── utils
└── test
```

## Packages

This repository contains the following packages:

| Package            | Description                                                                | Latest release                            |
|--------------------|----------------------------------------------------------------------------|-------------------------------------------|
| `@tymber/client`   | Dependency-less client that can be used in a frontend project or for tests | [`0.0.1`](packages/client/CHANGELOG.md)   |
| `@tymber/common`   | The internals of the framework                                             | [`0.0.1`](packages/common/CHANGELOG.md)   |
| `@tymber/core`     | The core module                                                            | [`0.0.1`](packages/core/CHANGELOG.md)     |
| `@tymber/postgres` | The PostgreSQL module (DB & PubSubService components)                      | [`0.0.1`](packages/postgres/CHANGELOG.md) |
| `@tymber/sqlite`   | The SQLite module                                                          | [`0.0.1`](packages/sqlite/CHANGELOG.md)   |

## License

[MIT](./LICENSE)
