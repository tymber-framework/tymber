import { describe, it } from "node:test";
import * as pg from "pg";
import { PostgresPubSubService } from "../src";

describe("PostgreSQL - PubSubService", () => {
  it("should not block the event loop", async () => {
    const pgPool = new pg.Pool({
      user: "postgres",
      password: "changeit",
    });

    const pubSubService = new PostgresPubSubService(pgPool);
    await pubSubService.init();

    await pgPool.end();
  });
});
