import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { emptyContext, sql } from "@tymber/common";

describe("ListMigrations", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();

    await ctx.db.query(
      emptyContext(),
      sql.deleteFrom("t_migrations").where(sql.notEq("module", "@tymber/core")),
    );

    await ctx.db.query(
      emptyContext(),
      sql
        .insert()
        .into("t_migrations")
        .values([
          {
            module: "module1",
            id: 1,
            name: "init",
            run_at: new Date("2000-01-01T00:00:00Z"),
          },
          {
            module: "module1",
            id: 2,
            name: "update",
            run_at: new Date("2000-02-02T00:00:00Z"),
          },
          {
            module: "module2",
            id: 1,
            name: "init",
            run_at: new Date("2000-03-03T00:00:00Z"),
          },
        ]),
    );
  });

  after(() => ctx.close());

  it("should work with default values", async () => {
    const res = await ctx.adminClient.listMigrations();

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 4);

    assert.partialDeepStrictEqual(res.body.items[0], {
      module: "@tymber/core",
      id: 1,
      name: "init",
      // runAt
    });

    assert.deepStrictEqual(res.body.items[1], {
      module: "module2",
      id: 1,
      name: "init",
      runAt: "2000-03-03T00:00:00.000Z",
    });
  });

  it("should work with sorting", async () => {
    const res = await ctx.adminClient.listMigrations({
      sort: "run_at:asc",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 4);

    assert.deepStrictEqual(res.body.items[0], {
      module: "module1",
      id: 1,
      name: "init",
      runAt: "2000-01-01T00:00:00.000Z",
    });
  });
});
