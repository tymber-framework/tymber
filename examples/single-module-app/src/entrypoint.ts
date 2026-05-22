import { App, toNodeHandler } from "@tymber/core";
import { PostgresDB } from "@tymber/postgres";
import { TodoModule } from "./module.js";
import * as pg from "pg";
import { createServer } from "node:http";

async function main() {
  const pgPool = new pg.Pool({
    user: "postgres",
    password: "changeit",
  });

  const db = new PostgresDB(pgPool);

  const app = await App.create({
    components: [db],
    modules: [TodoModule],
  });

  const httpServer = createServer(toNodeHandler(app.fetch));

  httpServer.listen(8080);
}

main().catch(console.error);
