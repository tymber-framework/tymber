import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { insertTestUser, setup, TestContext } from "../setup";
import { emptyContext, randomUUID, sql, type GroupRole } from "@tymber/core";

describe("AddUserToGroup", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
    ctx.groupRoleRegistry.add(0 as GroupRole);
    ctx.groupRoleRegistry.add(3 as GroupRole);
  });

  after(() => ctx.close());

  it("should work", async () => {
    const { userId } = await insertTestUser(ctx);

    const res = await ctx.adminClient.addUserToGroup(
      userId,
      ctx.groupIds[0],
      3,
    );

    assert.equal(res.status, 204);

    const rows = await ctx.db.query(
      emptyContext(),
      sql.select().from("t_memberships").where({
        user_id: userId,
      }),
    );

    assert.equal(rows.length, 1);

    assert.deepEqual(rows[0], {
      user_id: userId,
      group_id: ctx.groupIds[0],
      role: 3,
    });
  });

  it("should fail with an invalid role", async () => {
    const userId = randomUUID();

    await ctx.db.run(
      emptyContext(),
      sql
        .insert()
        .into("t_users")
        .values([
          {
            external_id: userId,
          },
        ]),
    );

    const res = await ctx.adminClient.addUserToGroup(
      userId,
      ctx.externalGroupIds[0],
      12,
    );

    assert.equal(res.status, 400);
  });

  it("should fail if the user is already in the group", async () => {
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

    const res = await ctx.adminClient.addUserToGroup(
      userId,
      ctx.groupIds[0],
      0,
    );

    assert.equal(res.status, 409);
  });

  it("should fail with an invalid user ID", async () => {
    const res = await ctx.adminClient.addUserToGroup("123", ctx.groupIds[0], 0);

    assert.equal(res.status, 404);
  });

  it("should fail with an invalid group ID", async () => {
    const res = await ctx.adminClient.addUserToGroup(ctx.userIds[0], "123", 0);

    assert.equal(res.status, 404);
  });
});
