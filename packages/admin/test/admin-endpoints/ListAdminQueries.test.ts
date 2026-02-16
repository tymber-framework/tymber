import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { emptyContext, sql } from "@tymber/common";

describe("ListAdminQueries", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();

    await ctx.db.query(emptyContext(), sql.deleteFrom("t_admin_queries"));

    await ctx.db.query(
      emptyContext(),
      sql
        .insert()
        .into("t_admin_queries")
        .values([
          {
            id: 1,
            created_at: new Date("2000-01-01T00:00:00Z"),
            created_by: 1,
            query: "query #1",
            comment: "comment #1",
            affected_rows: 11,
          },
          {
            id: 2,
            created_at: new Date("2000-02-02T00:00:00Z"),
            created_by: 1,
            query: "query #2",
            comment: "comment #2",
            affected_rows: 12,
          },
          {
            id: 3,
            created_at: new Date("2000-03-03T00:00:00Z"),
            created_by: 1,
            query: "query #3",
            comment: "comment #3",
            affected_rows: 13,
          },
        ]),
    );
  });

  after(() => ctx.close());

  it("should work with default values", async () => {
    const res = await ctx.adminClient.listAdminQueries();

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 3);

    assert.deepStrictEqual(res.body.items[0], {
      id: 3,
      createdAt: "2000-03-03T00:00:00.000Z",
      createdBy: {
        id: 1,
        username: "admin",
      },
      query: "query #3",
      comment: "comment #3",
      affectedRows: 13,
    });
  });

  it("should work with sorting", async () => {
    const res = await ctx.adminClient.listAdminQueries({
      sort: "created_at:asc",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 3);

    assert.deepStrictEqual(res.body.items[0], {
      id: 1,
      createdAt: "2000-01-01T00:00:00.000Z",
      createdBy: {
        id: 1,
        username: "admin",
      },
      query: "query #1",
      comment: "comment #1",
      affectedRows: 11,
    });
  });
});
