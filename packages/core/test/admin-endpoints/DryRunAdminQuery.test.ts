import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";

describe("DryRunAdminQuery", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    const res = await ctx.adminClient.dryRunAdminQuery({
      query:
        "UPDATE t_admin_users SET username = 'dry_run' WHERE username = 'admin'",
    });

    assert.equal(res.status, 200);
    assert.deepStrictEqual(res.body, {
      affectedRows: 1,
    });
  });

  it("should fail with an invalid query", async () => {
    const res = await ctx.adminClient.dryRunAdminQuery({
      query: "UPDATE admin_users THROW",
    });

    assert.equal(res.status, 400);
  });
});
