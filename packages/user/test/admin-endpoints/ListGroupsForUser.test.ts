import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { setup, type TestContext } from "../setup.js";

describe("ListGroupsForUser", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    const res = await ctx.adminClient.listGroupsForUser(ctx.userIds[0]);

    assert.equal(res.status, 200);

    assert.deepEqual(res.body.items, [
      {
        id: ctx.groupIds[0],
        label: "AAA",
        role: 0,
      },
    ]);
  });
});
