import { describe, it } from "node:test";
import assert from "node:assert";
import { AppInit, createTestApp, emptyContext, sql } from "@tymber/common";
import { createTestDB } from "../src";
import { join } from "node:path";

describe("SQLite - createTestApp", () => {
  it("should work", async () => {
    const ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "test",
          version: "0.0.1",
          assetsDir: join(import.meta.dirname, "test-assets"),
          init(app: AppInit) {},
        },
        {
          name: "test-nested",
          version: "0.0.1",
          assetsDir: join(import.meta.dirname, "test-assets-nested"),
          init(app: AppInit) {},
        },
      ],
    );

    const rows = await ctx.db.query(
      emptyContext(),
      sql.select().from("t_migrations"),
    );

    assert.equal(rows.length, 3);

    for (const row of rows) {
      assert.ok(typeof row.run_at === "number");
      delete row.run_at;
    }

    assert.deepStrictEqual(rows, [
      {
        module: "test",
        id: 1,
        name: "init",
      },
      {
        module: "test",
        id: 2,
        name: "update",
      },
      {
        module: "test-nested",
        id: 1,
        name: "init",
      },
    ]);

    await ctx.db.query(emptyContext(), sql.select().from("bar"));

    await ctx.close();
  });
});
