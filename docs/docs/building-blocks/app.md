import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# App

An `App` is a collection of [Modules](./module.md). It is the entry point of your application.

## Usage

<Tabs groupId="package-manager">
  <TabItem value="npm" default>

```ts title="index.ts"
import * as pg from "pg";
import { PostgresDB } from "@tymber/postgres";
import { App, toNodeHandler } from "@tymber/common";
import { AdminModule } from "@tymber/admin";
import { MyModule } from "./my-module";
import { createServer } from "node:http";

const pgPool = new pg.Pool({
  user: "postgres",
  password: "changeit",
});

const db = new PostgresDB(pgPool);

const app = await App.create({
  components: [db],
  modules: [
      AdminModule,
      MyModule,
  ]
});

const httpServer = createServer(toNodeHandler(app.fetch));

httpServer.listen(8080);
```

And then with [`tsx`](https://www.npmjs.com/package/tsx):

```bash
npx tsx index.ts
```

  </TabItem>

  <TabItem value="bun" label="Bun">

```ts title="index.ts"
import * as pg from "pg";
import { PostgresDB } from "@tymber/postgres";
import { App } from "@tymber/common";
import { MyModule } from "./my-module";
import { AdminModule } from "@tymber/admin";

const pgPool = new pg.Pool({
  user: "postgres",
  password: "changeit",
});

const db = new PostgresDB(pgPool);

const app = await App.create({
  components: [db],
  modules: [
      AdminModule,
      MyModule,
  ],
});

export default {
  port: 8080,
  fetch: app.fetch,
};
```

And then:

```bash
bun index.ts
```

  </TabItem>
</Tabs>

The `components` arguments allows providing already instantiated components, like a database pool.

## Shutdown

The application can be cleanly shut down by calling `app.close()`:

```ts
process.on("SIGTERM", async () => {
   await app.close(); 
});
```
