import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { AdminClient } from "@tymber/client";
import { emptyContext, sql } from "@tymber/common";

describe("InitPassword", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    await ctx.db.run(
      emptyContext(),
      sql.update("t_admin_users").set({ is_temporary_password: true }),
    );

    const res = await ctx.adminClient.initPassword({
      password: "abc12345",
    });

    assert.equal(res.status, 204);

    const reinitResponse = await ctx.adminClient.initPassword({
      password: "abc12345",
    });

    assert.equal(reinitResponse.status, 400);
  });
});
