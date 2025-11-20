import { afterEach, beforeEach, describe, it } from "node:test";
import * as assert from "node:assert";
import { createTestDB } from "../src";
import {
  Context,
  type DB,
  DuplicateKeyError,
  emptyContext,
  sql,
} from "@tymber/common";

describe("SQLite", () => {
  let db: DB;
  let ctx: Context;

  beforeEach(async () => {
    ctx = emptyContext();
    db = await createTestDB();

    await db.run(
      ctx,
      sql.rawStatement(`
      CREATE TABLE foo (
        id INT PRIMARY KEY
      ) STRICT;
    `),
    );
  });

  afterEach(() => {
    db.close();
  });

  it("should work", async () => {
    const result = await db.query(ctx, sql.select([sql.raw("1")]));

    assert.deepEqual(result, [{ 1: 1 }]);
  });

  it("should throw a duplicate key error", async () => {
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
  });

  it("should commit the transaction", async () => {
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
  });

  it("should rollback the transaction", async () => {
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
      assert.fail("should not happen");
    } catch (e) {
      assert.equal(e, "unexpected error");
    }

    const result = await db.query(ctx, sql.select().from("foo"));

    assert.deepEqual(result, []);
  });
});
