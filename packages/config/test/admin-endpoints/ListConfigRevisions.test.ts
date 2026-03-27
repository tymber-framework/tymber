import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, TestContext } from "../setup";
import { emptyContext, sql } from "@tymber/core";

describe("ListConfigRevisions", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();

    const initContext = emptyContext();

    await ctx.db.query(initContext, sql.deleteFrom("t_config_revisions"));

    await ctx.db.query(
      initContext,
      sql
        .insert()
        .into("t_config_revisions")
        .values([
          {
            id: 1,
            created_at: "2000-01-01T00:00:00.000Z",
            created_by: ctx.adminUserId,
            comment: "initial commit",
          },
          {
            id: 2,
            created_at: "2000-01-02T00:00:00.000Z",
          },
          {
            id: 3,
            created_at: "2000-01-03T00:00:00.000Z",
          },
        ]),
    );
  });

  after(() => ctx.close());

  it("should work with default values", async () => {
    const res = await ctx.adminClient.listConfigRevisions();

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 3);

    assert.deepStrictEqual(res.body.items[0], {
      id: 1,
      createdAt: "2000-01-01T00:00:00.000Z",
      createdBy: {
        id: ctx.adminUserId,
        username: "admin",
      },
      comment: "initial commit",
    });
  });

  it("should work with pagination", async () => {
    const res = await ctx.adminClient.listConfigRevisions({
      page: 2,
      size: 1,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);
  });

  it("should work with sorting", async () => {
    const res = await ctx.adminClient.listConfigRevisions({
      sort: "created_at:desc",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 3);

    assert.strictEqual(res.body.items[0].id, 3);
    assert.strictEqual(res.body.items[1].id, 2);
    assert.strictEqual(res.body.items[2].id, 1);
  });
});
