import * as pg from "pg";
import { PostgresDB } from "@tymber/postgres";
import { App, toNodeHandler } from "@tymber/common";
import { CoreModule } from "@tymber/core";
import { createServer } from "node:http";

async function main() {
  let pgPool = new pg.Pool({
    user: "postgres",
    password: "changeit",
  });

  const db = new PostgresDB(pgPool);

  const app = await App.create(db, [CoreModule]);

  const httpServer = createServer(toNodeHandler(app.fetch.bind(app)));

  httpServer.listen(8080);
}

main().catch(console.error);
