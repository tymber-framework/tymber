import { describe, it } from "node:test";
import * as assert from "node:assert";
import { createTestDB } from "../src";
import { DuplicateKeyError, emptyContext, sql } from "@tymber/common";

describe("PostgreSQL", () => {
  it("should work", async () => {
    const ctx = emptyContext();
    const db = await createTestDB();

    const result = await db.query(ctx, sql.select([sql.raw("1")]));

    assert.deepEqual(result, [{ "?column?": 1 }]);
    await db.close();
  });

  it("should throw a duplicate key error", async () => {
    const ctx = emptyContext();
    const db = await createTestDB();

    await db.run(
      ctx,
      sql.rawStatement(`
      CREATE TABLE foo (
        id INT PRIMARY KEY
      );
    `),
    );

    await db.run(
      ctx,
      sql
        .insert()
        .into("foo")
        .values([{ id: 1 }]),
    );

    try {
      await db.run(
        ctx,
        sql
          .insert()
          .into("foo")
          .values([{ id: 1 }]),
      );
      assert.fail("should not happen");
    } catch (e) {
      assert.ok(e instanceof DuplicateKeyError);
    }
    await db.close();
  });

  it("should commit the transaction", async () => {
    const ctx = emptyContext();
    const db = await createTestDB();

    await db.run(
      ctx,
      sql.rawStatement(`
      CREATE TABLE foo (
        id INT PRIMARY KEY
      );
    `),
    );

    await db.startTransaction(ctx, async () => {
      await db.run(
        ctx,
        sql
          .insert()
          .into("foo")
          .values([{ id: 1 }]),
      );
    });

    const result = await db.query(ctx, sql.select().from("foo"));

    assert.deepEqual(result, [{ id: 1 }]);
    await db.close();
  });

  it("should rollback the transaction", async () => {
    const ctx = emptyContext();
    const db = await createTestDB();

    await db.run(
      ctx,
      sql.rawStatement(`
      CREATE TABLE foo (
        id INT PRIMARY KEY
      );
    `),
    );

    try {
      await db.startTransaction(ctx, async () => {
        await db.run(
          ctx,
          sql
            .insert()
            .into("foo")
            .values([{ id: 1 }]),
        );

        throw "unexpected error";
      });
    } catch (e) {}

    const result = await db.query(ctx, sql.select().from("foo"));

    assert.deepEqual(result, []);
    await db.close();
  });
});
