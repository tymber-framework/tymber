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

const app = await App.create(db, [CoreModule]);

const httpServer = createServer(toNodeHandler(app.fetch));

httpServer.listen(8080);
