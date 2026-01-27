import * as pg from "pg";
import { PostgresDB } from "@tymber/postgres";
import { App, emptyContext, sql, toNodeHandler } from "@tymber/common";
import { CoreModule } from "@tymber/core";
import { createServer } from "node:http";
import { USER_ROLES, UserModule } from "@tymber/user";
import { randomUUID } from "node:crypto";

const pgPool = new pg.Pool({
  user: "postgres",
  password: "changeit",
});

const db = new PostgresDB(pgPool);

const app = await App.create({
  components: [db],
  modules: [CoreModule, UserModule],
});

await db.run(emptyContext(), sql.deleteFrom("t_user_sessions"));
await db.run(emptyContext(), sql.deleteFrom("t_user_roles"));
await db.run(emptyContext(), sql.deleteFrom("t_users"));
await db.run(emptyContext(), sql.deleteFrom("t_groups"));

await db.run(
  emptyContext(),
  sql
    .insert()
    .into("t_users")
    .values([
      {
        id: randomUUID(),
        first_name: "alice",
        last_name: "smith",
      },
      {
        id: randomUUID(),
        first_name: "bob",
        last_name: "jones",
      },
      {
        id: randomUUID(),
        first_name: "carol",
        last_name: "davis",
      },
    ]),
);

await db.run(
  emptyContext(),
  sql
    .insert()
    .into("t_groups")
    .values([
      {
        id: randomUUID(),
        label: "group 1",
      },
      {
        id: randomUUID(),
        label: "group 2",
      },
      {
        id: randomUUID(),
        label: "group 3",
      },
    ]),
);

const httpServer = createServer(toNodeHandler(app.fetch));

httpServer.listen(8080);
