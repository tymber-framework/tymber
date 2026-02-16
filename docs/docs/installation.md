import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Installation

<Tabs groupId="package-manager">
  <TabItem value="npm" default>

```bash
npm install @tymber/core @tymber/admin @tymber/postgres pg
```

  </TabItem>

  <TabItem value="bun" label="Bun">

```bash
bun add @tymber/core @tymber/admin @tymber/postgres pg
```

  </TabItem>
</Tabs>

## Usage

<Tabs groupId="package-manager">
  <TabItem value="npm" default>

```ts title="index.ts"
import * as pg from "pg";
import { PostgresDB } from "@tymber/postgres";
import { App, toNodeHandler } from "@tymber/core";
import { AdminModule } from "@tymber/admin";
import { createServer } from "node:http";

const pgPool = new pg.Pool({
  user: "postgres",
  password: "changeit",
});

const db = new PostgresDB(pgPool);

const app = await App.create({
  components: [db],
  modules: [AdminModule]
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
import { App } from "@tymber/core";
import { AdminModule } from "@tymber/admin";

const pgPool = new pg.Pool({
  user: "postgres",
  password: "changeit",
});

const db = new PostgresDB(pgPool);

const app = await App.create({
  components: [db],
  modules: [AdminModule],
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

Finally, head to http://localhost:8080:

![Initialization page](/img/init_page.png)

And *voilà!*

## Dependency tree

Running the installation command above currently brings 38 packages:

```bash
sample-app@
├─┬ @tymber/core@0.1.0
│ ├─┬ ajv-formats@3.0.1
│ │ └── ajv@8.17.1 deduped
│ └─┬ ajv@8.17.1
│   ├── fast-deep-equal@3.1.3
│   ├── fast-uri@3.1.0
│   ├── json-schema-traverse@1.0.0
│   └── require-from-string@2.0.2
├─┬ @tymber/admin@0.1.0
│ ├── @tymber/core@0.1.0 deduped
│ └─┬ argon2@0.44.0
│   ├── @phc/format@1.0.0
│   ├─┬ cross-env@10.1.0
│   │ ├── @epic-web/invariant@1.0.0
│   │ └─┬ cross-spawn@7.0.6
│   │   ├── path-key@3.1.1
│   │   ├─┬ shebang-command@2.0.0
│   │   │ └── shebang-regex@3.0.0
│   │   └─┬ which@2.0.2
│   │     └── isexe@2.0.0
│   ├── node-addon-api@8.5.0
│   └── node-gyp-build@4.8.4
├─┬ @tymber/postgres@0.0.1
│ ├── @tymber/core@0.1.0 deduped
│ ├─┬ @types/pg@8.16.0
│ │ ├─┬ @types/node@25.2.3
│ │ │ └── undici-types@7.16.0
│ │ ├── pg-protocol@1.11.0 deduped
│ │ └── pg-types@2.2.0 deduped
│ └── pg@8.18.0 deduped
└─┬ pg@8.18.0
  ├── pg-cloudflare@1.3.0
  ├── pg-connection-string@2.11.0
  ├── UNMET OPTIONAL DEPENDENCY pg-native@>=3.0.1
  ├─┬ pg-pool@3.11.0
  │ └── pg@8.18.0 deduped
  ├── pg-protocol@1.11.0
  ├─┬ pg-types@2.2.0
  │ ├── pg-int8@1.0.1
  │ ├── postgres-array@2.0.0
  │ ├── postgres-bytea@1.0.1
  │ ├── postgres-date@1.0.7
  │ └─┬ postgres-interval@1.2.0
  │   └── xtend@4.0.2
  └─┬ pgpass@1.0.5
    └── split2@4.2.0
```

## Additional modules

Tymber provides additional modules that can be installed separately:

| Package            | Description                                                                |
|--------------------|----------------------------------------------------------------------------|
| `@tymber/client`   | Dependency-less client that can be used in a frontend project or for tests |
| `@tymber/user`     | The user module                                                            |
| `@tymber/postgres` | The PostgreSQL module                                                      |
| `@tymber/sqlite`   | The SQLite module                                                          |
