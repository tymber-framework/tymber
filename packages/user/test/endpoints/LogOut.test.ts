import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { setup, TestContext } from "../setup";
import { randomUUID } from "node:crypto";
import { emptyContext, sql } from "@tymber/core";
import { UserClient } from "@tymber/client";

describe("LogOut", () => {
  let ctx: TestContext;
  let client: UserClient;

  before(async () => {
    ctx = await setup();

    const sessionId = randomUUID();

    await ctx.db.query(
      emptyContext(),
      sql
        .insert()
        .into("t_user_sessions")
        .values([
          {
            id: sessionId,
            user_id: ctx.internalUserIds[0],
          },
        ]),
    );

    client = new UserClient(ctx.baseUrl, {
      cookie: `sid=${sessionId}`,
    });
  });

  after(() => ctx.close());

  it("should work", async () => {
    const res = await client.getSelf();

    assert.equal(res.status, 200);

    const logOutRes = await client.logOut();

    assert.equal(logOutRes.status, 204);

    const getSelfRes = await client.getSelf();

    assert.equal(getSelfRes.status, 401);
  });
});
