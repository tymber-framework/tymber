import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { AdminClient } from "@tymber/client";
import { emptyContext, randomUUID, sql } from "@tymber/core";

describe("GetSelf", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    const res = await ctx.adminClient.getSelf();

    assert.equal(res.status, 200);
    assert.deepStrictEqual(res.body, {
      id: ctx.adminUserId,
    });
  });

  it("should fail with an anonymous user", async () => {
    const client = new AdminClient(ctx.baseUrl);
    const res = await client.getSelf();

    assert.equal(res.status, 401);
  });

  it("should fail with an expired session", async () => {
    const sessionId = randomUUID();

    await ctx.db.run(
      emptyContext(),
      sql
        .insert()
        .into("t_admin_sessions")
        .values([
          {
            id: sessionId,
            user_id: ctx.adminUserId,
            expires_at: new Date(Date.now() - 1000),
          },
        ]),
    );

    const client = new AdminClient(ctx.baseUrl, {
      cookie: `ssid=${sessionId}`,
    });

    const res = await client.getSelf();

    assert.equal(res.status, 401);
  });
});
