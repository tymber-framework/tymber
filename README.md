<h1>Tymber framework</h1>

Tymber is a batteries-included framework for building TypeScript applications.

**Table of contents**

<!-- TOC -->
  * [Documentation](#documentation)
  * [Getting started](#getting-started)
    * [Bun](#bun)
      * [Installation](#installation)
      * [Usage](#usage)
    * [Node.js](#nodejs)
      * [Installation](#installation-1)
      * [Usage](#usage-1)
  * [Packages](#packages)
  * [License](#license)
<!-- TOC -->

## Documentation

https://tymber-framework.github.io/tymber/

## Getting started

### Bun

#### Installation

```
bun add @tymber/common @tymber/core @tymber/postgres
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

const app = await App.create({
  components: [db],
  modules: [CoreModule],
});

export default {
  port: 8080,
  fetch: app.fetch,
};
```

### Node.js

#### Installation

```
npm i @tymber/common @tymber/core @tymber/postgres
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

const app = await App.create({
  components: [db],
  modules: [CoreModule]
});

const httpServer = createServer(toNodeHandler(app.fetch));

httpServer.listen(8080);
```

## Packages

This repository contains the following packages:

| Package            | Description                                                                | Latest release                            |
|--------------------|----------------------------------------------------------------------------|-------------------------------------------|
| `@tymber/client`   | Dependency-less client that can be used in a frontend project or for tests | [`0.1.0`](packages/client/CHANGELOG.md)   |
| `@tymber/common`   | The internals of the framework                                             | [`0.1.0`](packages/common/CHANGELOG.md)   |
| `@tymber/core`     | The core module                                                            | [`0.1.0`](packages/core/CHANGELOG.md)     |
| `@tymber/user`     | The user module                                                            | [`0.0.1`](packages/user/CHANGELOG.md)     |
| `@tymber/postgres` | The PostgreSQL module (DB & PubSubService components)                      | [`0.0.1`](packages/postgres/CHANGELOG.md) |
| `@tymber/sqlite`   | The SQLite module                                                          | [`0.0.1`](packages/sqlite/CHANGELOG.md)   |

## License

[MIT](./LICENSE)
