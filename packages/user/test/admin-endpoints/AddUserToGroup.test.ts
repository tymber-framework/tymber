import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { insertTestUser, setup, TestContext } from "../setup";
import { emptyContext, randomUUID, sql } from "@tymber/common";
import { USER_ROLES } from "../../src";

describe("AddUserToGroup", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    USER_ROLES.push(3);

    const { userId, internalUserId } = await insertTestUser(ctx);

    const res = await ctx.adminClient.addUserToGroup(
      userId,
      ctx.groupIds[0],
      3,
    );

    assert.equal(res.status, 204);

    const rows = await ctx.db.query(
      emptyContext(),
      sql.select().from("t_user_roles").where({
        user_id: internalUserId,
      }),
    );

    assert.equal(rows.length, 1);

    assert.deepEqual(rows[0], {
      user_id: internalUserId,
      group_id: ctx.internalGroupIds[0],
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
            id: userId,
          },
        ]),
    );

    const res = await ctx.adminClient.addUserToGroup(
      userId,
      ctx.groupIds[0],
      12,
    );

    assert.equal(res.status, 400);
  });

  it("should fail if the user is already in the group", async () => {
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

    const res = await ctx.adminClient.addUserToGroup(
      userId,
      ctx.groupIds[0],
      0,
    );

    assert.equal(res.status, 400);
  });

  it("should fail with an invalid user ID", async () => {
    const res = await ctx.adminClient.addUserToGroup(
      randomUUID(),
      ctx.groupIds[0],
      0,
    );

    assert.equal(res.status, 400);
  });

  it("should fail with an invalid group ID", async () => {
    const res = await ctx.adminClient.addUserToGroup(
      ctx.userIds[0],
      randomUUID(),
      0,
    );

    assert.equal(res.status, 400);
  });
});
