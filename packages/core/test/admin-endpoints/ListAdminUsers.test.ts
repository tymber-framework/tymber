import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { emptyContext, sql } from "@tymber/common";

describe("ListAdminUsers", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();

    const initContext = emptyContext();

    await ctx.db.query(
      initContext,
      sql.deleteFrom("t_admin_users").where(sql.gt("id", 1)),
    );

    await ctx.db.query(
      initContext,
      sql
        .insert()
        .into("t_admin_users")
        .values([
          {
            id: 2,
            username: "alice",
            created_at: new Date("2000-01-01T00:00:00Z"),
            created_by: ctx.adminUserId,
            updated_at: new Date("2000-01-01T00:00:00Z"),
            updated_by: ctx.adminUserId,
          },
          {
            id: 3,
            username: "bob",
          },
          {
            id: 4,
            username: "carol",
          },
        ]),
    );
  });

  after(() => ctx.close());

  it("should work with default values", async () => {
    const res = await ctx.adminClient.listAdminUsers();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.items.length, 4);

    assert.deepStrictEqual(res.body.items[1], {
      id: 2,
      createdAt: "2000-01-01T00:00:00.000Z",
      createdBy: 1,
      updatedAt: "2000-01-01T00:00:00.000Z",
      updatedBy: 1,
      username: `alice`,
    });
    assert.strictEqual(res.body.items[2].id, 3);
    assert.strictEqual(res.body.items[3].id, 4);
  });

  it("should work with sorting", async () => {
    const res = await ctx.adminClient.listAdminUsers({
      sort: "username:desc",
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.items.length, 4);
    assert.strictEqual(res.body.items[0].username, "carol");
  });

  it("should work with search", async () => {
    const res = await ctx.adminClient.listAdminUsers({
      q: "al",
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.items.length, 1);
    assert.strictEqual(res.body.items[0].username, "alice");
  });
});
