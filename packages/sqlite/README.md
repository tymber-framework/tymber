<h1>SQLite module of the Tymber framework</h1>

The SQLite module.

**Table of contents**

<!-- TOC -->
  * [Installation](#installation)
  * [Usage](#usage)
  * [License](#license)
<!-- TOC -->

## Installation

```
npm i @tymber/sqlite
```

## Usage

```ts
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { SQLiteDB } from "@tymber/sqlite";

const dbFile = await open({
  filename: "/tmp/mydb.sqlite",
  driver: sqlite3.Database,
});

const db = new SQLiteDB(dbFile);
```

## License

[MIT](./LICENSE)
