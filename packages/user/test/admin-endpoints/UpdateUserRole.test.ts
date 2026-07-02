import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { insertTestUser, setup, TestContext } from "../setup.js";
import { emptyContext, randomUUID, sql, UserRole } from "@tymber/core";

describe("UpdateUserRole", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
    ctx.userRoleRegistry.add(10 as UserRole);
  });

  after(() => ctx.close());

  it("should work", async () => {
    const { userId } = await insertTestUser(ctx);

    const res = await ctx.adminClient.updateUserRole(userId, 10);

    assert.equal(res.status, 204);

    const user = await ctx.db.query(
      emptyContext(),
      sql.select().from("t_users").where({ id: userId }),
    );

    assert.equal(user.length, 1);
    assert.equal(user[0].role, 10);
  });

  it("should fail with an invalid role", async () => {
    const { userId } = await insertTestUser(ctx);

    const res = await ctx.adminClient.updateUserRole(userId, 999);

    assert.equal(res.status, 400);
  });

  it("should fail if the user already has the role", async () => {
    const { userId } = await insertTestUser(ctx);

    await ctx.adminClient.updateUserRole(userId, 10);
    const res = await ctx.adminClient.updateUserRole(userId, 10);

    assert.equal(res.status, 204);
  });

  it("should fail with an invalid user ID", async () => {
    const res = await ctx.adminClient.updateUserRole(randomUUID(), 10);

    assert.equal(res.status, 404);
  });
});
