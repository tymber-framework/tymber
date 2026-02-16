import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { AdminClient } from "@tymber/client";

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
});
