import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { randomUUID } from "node:crypto";
import { emptyContext, sql } from "@tymber/common";
import { AdminClient } from "@tymber/client";

describe("LogOut", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    const sessionId = randomUUID();

    await ctx.db.query(
      emptyContext(),
      sql
        .insert()
        .into("t_admin_sessions")
        .values([
          {
            id: sessionId,
            user_id: ctx.adminUserId,
          },
        ]),
    );

    const defaultHeaders = {
      cookie: `ssid=${sessionId}`,
    };
    const client = new AdminClient(ctx.baseUrl, defaultHeaders);

    const getSelfResponse = await client.getSelf();
    assert.equal(getSelfResponse.status, 200);

    const logOutResponse = await client.logOut();
    assert.equal(logOutResponse.status, 204);

    const newGetSelfResponse = await client.getSelf();
    assert.equal(newGetSelfResponse.status, 401);
  });
});
