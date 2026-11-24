import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { emptyContext, sql, sleep } from "@tymber/core";

describe("LogRequest", () => {
  let ctx: TestContext;

  before(async () => {
    process.env.ADMIN_INCOMING_REQUESTS_FLUSH_INTERVAL_IN_MS = "10";
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should log incoming requests", async () => {
    // remove any existing logs
    await ctx.db.run(emptyContext(), sql.deleteFrom("t_incoming_requests"));

    {
      await fetch(`${ctx.baseUrl}/test`, {
        method: "GET",
      });

      await fetch(`${ctx.baseUrl}/throwing`, {
        method: "POST",
      });

      // not logged
      await fetch(`${ctx.baseUrl}/notfound`, {
        method: "GET",
      });

      // not logged
      await ctx.adminClient.getSelf();

      // not logged
      await fetch(`${ctx.baseUrl}/static/admin/css/common.css`);
    }

    // wait for flush
    await sleep(30);

    // verify logs
    const rows = await ctx.db.query(
      emptyContext(),
      sql.select().from("t_incoming_requests"),
    );

    assert.equal(rows.length, 2);

    assert.deepStrictEqual(rows[0], {
      id: rows[0].id,
      created_at: rows[0].created_at,
      request_id: rows[0].request_id,
      method: "GET",
      matched_route: "/test",
      path: "/test",
      duration_in_ms: rows[0].duration_in_ms,
      status: 200,
      user_id: null,
    });

    assert.deepStrictEqual(rows[1], {
      id: rows[1].id,
      created_at: rows[1].created_at,
      request_id: rows[1].request_id,
      method: "POST",
      matched_route: "/throwing",
      path: "/throwing",
      duration_in_ms: rows[1].duration_in_ms,
      status: 500,
      user_id: null,
    });
  });
});
