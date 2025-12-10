<h1>PostgreSQL module of the Tymber framework</h1>

The PostgreSQL module (DB & PubSubService components).

**Table of contents**

<!-- TOC -->
  * [Installation](#installation)
  * [Usage](#usage)
  * [License](#license)
<!-- TOC -->

## Installation

```
npm i @tymber/postgres pg
```

## Usage

```ts
import * as pg from "pg";
import { PostgresDB } from "@tymber/postgres";

const pgPool = new pg.Pool({
  user: "postgres",
  password: "changeit",
});

const db = new PostgresDB(pgPool);
```

## License

[MIT](./LICENSE)
