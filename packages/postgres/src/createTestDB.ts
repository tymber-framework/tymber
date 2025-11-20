import { randomId } from "@tymber/common";
import * as pg from "pg";
import { PostgresDB } from "./DB.js";

// each process gets its own schema, so tests don't interfere with each other
const runId = randomId();

export async function createTestDB() {
  const pgPool = new pg.Pool({
    user: "postgres",
    password: "changeit",
  });

  const testSchema = `test-${runId}`;

  await pgPool.query(`CREATE SCHEMA "${testSchema}";`);

  pgPool.on("acquire", (client) => {
    // not suitable for production but OK for tests, see https://github.com/brianc/node-postgres/issues/2619
    client.query(`SET search_path TO "${testSchema}";`);
  });

  let db = new PostgresDB(pgPool);

  db.close = async () => {
    await pgPool.query(`DROP SCHEMA "${testSchema}" CASCADE`);
    await pgPool.end();
  };

  return db;
}
