import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { emptyContext, sql } from "@tymber/common";

describe("RunAdminQuery", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
    await ctx.db.run(emptyContext(), sql.deleteFrom("t_admin_queries"));
  });

  after(() => ctx.close());

  it("should work", async () => {
    const res = await ctx.adminClient.runAdminQuery({
      query: "UPDATE t_admin_users SET username = 'dry_run' WHERE id = 1",
      comment: "test",
    });

    assert.equal(res.status, 200);
    assert.deepStrictEqual(res.body, {
      affectedRows: 1,
    });

    const rows = await ctx.db.query(
      emptyContext(),
      sql.select().from("t_admin_queries"),
    );
    assert.equal(rows.length, 1);
    assert.partialDeepStrictEqual(rows[0], {
      id: 1,
      created_by: ctx.adminUserId,
      query: "UPDATE t_admin_users SET username = 'dry_run' WHERE id = 1",
      comment: "test",
      affected_rows: 1,
    });
  });

  it("should fail with an invalid query", async () => {
    const res = await ctx.adminClient.runAdminQuery({
      query: "UPDATE t_admin_users THROW",
      comment: "test",
    });

    assert.equal(res.status, 400);
  });
});
