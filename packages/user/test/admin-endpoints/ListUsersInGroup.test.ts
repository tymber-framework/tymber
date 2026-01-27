import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { setup, type TestContext } from "../setup.js";

describe("ListUsersInGroup", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    const res = await ctx.adminClient.listUsersInGroup(ctx.groupIds[0]);

    assert.equal(res.status, 200);

    assert.deepEqual(res.body.items, [
      {
        id: ctx.userIds[1],
        firstName: "bob",
        lastName: "johnson",
        email: "bob@johnson.com",
        role: 1,
      },
      {
        id: ctx.userIds[0],
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@smith.com",
        role: 0,
      },
    ]);
  });
});
