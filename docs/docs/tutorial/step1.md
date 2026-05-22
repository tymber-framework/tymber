import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Step 1: Initialization

Welcome to the tutorial of the Tymber framework!

In this tutorial, we will build a classic TODO application while taking a tour of the features provided by the framework.

## Prerequisites

For this tutorial, you will need either [Node.js](https://nodejs.org/) (v24 or higher) or [Bun](https://bun.sh/).

## Scaffolding

### Create a new directory

In a terminal, run the following command:

```bash
mkdir my-todo-app && cd my-todo-app
```

### Initialize the `package.json` file

<Tabs groupId="package-manager">
  <TabItem value="npm" default>

```bash
npm init --init-type=module -y
```

  </TabItem>
  <TabItem value="bun">

```bash
bun init -y
```

  </TabItem>
</Tabs>

### Install the dependencies

<Tabs groupId="package-manager">
  <TabItem value="npm" default>

```bash
npm install @tymber/core @tymber/sqlite
```

  </TabItem>
  <TabItem value="bun">

```bash
bun add @tymber/core @tymber/sqlite
```

  </TabItem>
</Tabs>

:::tip

As you can see, this tutorial uses the [SQLite database](https://sqlite.org/) but Tymber also supports other databases such as [PostgreSQL](https://www.postgresql.org/).

:::

### Install the dependencies for development

<Tabs groupId="package-manager">
  <TabItem value="npm" default>

```bash
npm install -D typescript tsx @types/node @tsconfig/node24 @tymber/client
```

  </TabItem>
  <TabItem value="bun">

```bash
bun add -D typescript @types/node @tsconfig/node24 @tymber/client
```

  </TabItem>
</Tabs>

### Initialize the `tsconfig.json` file

Create a `tsconfig.json` file with the following content:

```json title="tsconfig.json"
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@tsconfig/node24/tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "verbatimModuleSyntax": true
  },
  "include": [
    "src/**/*.ts"
  ]
}
```

### Create the module

A Tymber application can be split into modules. For this tutorial, we will create a single module named `TodoModule`:

```ts title="src/module.ts"
import { type Module } from "@tymber/core";
import { join } from "node:path";

export const TodoModule: Module = {
  name: "my-todo-app",
  version: "0.0.1",
  assetsDir: join(import.meta.dirname, "..", "assets"),

  init(app) {
    // register components here (services, repositories, endpoints, etc.)
  }
};
```

:::tip

Tymber also provides several first-party modules that you can include in your application:

| Package           | Usage                    |
|-------------------|--------------------------|
| `@tymber/admin`   | Admin dashboard          |
| `@tymber/user`    | User management          |
| `@tymber/config`  | Configuration management |
| `@tymber/openapi` | OpenAPI console          |

:::

### Create the entrypoint of your application

Create an `entrypoint.ts` file in the `src/` directory with the following content:

<Tabs groupId="package-manager">
  <TabItem value="npm" default>

```ts title="src/entrypoint.ts"
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { SQLiteDB } from "@tymber/sqlite";
import { App, toNodeHandler } from "@tymber/core";
import { createServer } from "node:http";
import { TodoModule } from "./module.js";

async function main() {
  const dbFile = await open({
    filename: "/tmp/my-todo-app.db",
    driver: sqlite3.Database,
  });

  const db = new SQLiteDB(dbFile);

  const app = await App.create({
    components: [db],
    modules: [TodoModule],
  });

  const httpServer = createServer(toNodeHandler(app.fetch));

  httpServer.listen(8080);
}

main().catch(console.error);
```

  </TabItem>
  <TabItem value="bun">

```ts title="src/entrypoint.ts"
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { SQLiteDB } from "@tymber/sqlite";
import { App } from "@tymber/core";
import { TodoModule } from "./module.js";

const dbFile = await open({
  filename: "/tmp/my-todo-app.db",
  driver: sqlite3.Database,
});

const db = new SQLiteDB(dbFile);

const app = await App.create({
  components: [db],
  modules: [TodoModule],
});

export default {
  port: 8080,
  fetch: app.fetch,
};
```

  </TabItem>
</Tabs>

You can then start the application with:

<Tabs groupId="package-manager">
  <TabItem value="npm" default>

```bash
npx tsx src/entrypoint.ts
```

  </TabItem>
  <TabItem value="bun">

```bash
bun src/entrypoint.ts
```

  </TabItem>
</Tabs>

## Ending note

That's it for the scaffolding! You should now have the following directory structure:

```text
my-todo-app/
├── package.json
├── src/
│   ├── entrypoint.ts
│   └── module.ts
└── tsconfig.json
```
