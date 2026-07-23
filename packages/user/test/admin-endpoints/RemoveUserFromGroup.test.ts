import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { insertTestUser, setup, TestContext } from "../setup";
import { emptyContext, sql } from "@tymber/core";

describe("RemoveUserFromGroup", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    const { userId } = await insertTestUser(ctx);

    await ctx.db.run(
      emptyContext(),
      sql
        .insert()
        .into("t_memberships")
        .values([
          {
            user_id: userId,
            group_id: ctx.groupIds[0],
            role: 0,
          },
        ]),
    );

    const res = await ctx.adminClient.removeUserFromGroup(
      userId,
      ctx.groupIds[0],
    );

    assert.equal(res.status, 204);

    const rows = await ctx.db.query(
      emptyContext(),
      sql.select().from("t_memberships").where({
        user_id: userId,
      }),
    );

    assert.equal(rows.length, 0);
  });

  it("should fail with an invalid user ID", async () => {
    const res = await ctx.adminClient.removeUserFromGroup(
      "123",
      ctx.groupIds[0],
    );

    assert.equal(res.status, 404);
  });

  it("should fail with an invalid group ID", async () => {
    const res = await ctx.adminClient.removeUserFromGroup(
      ctx.userIds[0],
      "123",
    );

    assert.equal(res.status, 404);
  });
});
