import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { insertTestUser, setup, TestContext } from "../setup";
import { emptyContext, randomUUID, sql } from "@tymber/common";

describe("RemoveUserFromGroup", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    const { userId, internalUserId } = await insertTestUser(ctx);

    await ctx.db.run(
      emptyContext(),
      sql
        .insert()
        .into("t_user_roles")
        .values([
          {
            user_id: internalUserId,
            group_id: ctx.internalGroupIds[0],
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
      sql.select().from("t_user_roles").where({
        user_id: internalUserId,
      }),
    );

    assert.equal(rows.length, 0);
  });

  it("should fail with an invalid user ID", async () => {
    const res = await ctx.adminClient.removeUserFromGroup(
      randomUUID(),
      ctx.groupIds[0],
    );

    assert.equal(res.status, 400);
  });

  it("should fail with an invalid group ID", async () => {
    const res = await ctx.adminClient.removeUserFromGroup(
      ctx.userIds[0],
      randomUUID(),
    );

    assert.equal(res.status, 400);
  });
});
