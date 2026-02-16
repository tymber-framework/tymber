import { describe, it } from "node:test";
import * as assert from "node:assert";
import { createTestDB } from "../src";
import { emptyContext, Repository, sql } from "@tymber/core";

describe("SQLite - Repository", () => {
  it("should work", async () => {
    const db = await createTestDB();

    await db.run(
      emptyContext(),
      sql.rawStatement(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT
      ) STRICT;
    `),
    );

    interface User {
      id: number;
      firstName: string;
    }

    const repository = new (class extends Repository<number, User> {
      tableName = "users";
    })(db);

    const returnedValue = await repository.save(emptyContext(), {
      firstName: "Bob",
    });

    assert.deepStrictEqual(returnedValue, { id: 1, firstName: "Bob" });

    const storedValue = await repository.findById(emptyContext(), 1);

    assert.deepStrictEqual(storedValue, { id: 1, firstName: "Bob" });

    await repository.save(emptyContext(), {
      id: 1,
      firstName: "Alice",
    });

    const updatedValue = await repository.findById(emptyContext(), 1);

    assert.deepStrictEqual(updatedValue, { id: 1, firstName: "Alice" });

    db.close();
  });

  it("should work (composite ID)", async () => {
    const db = await createTestDB();

    await db.run(
      emptyContext(),
      sql.rawStatement(`
      CREATE TABLE users (
        org_id TEXT,
        id INTEGER,
        name TEXT,

        PRIMARY KEY (org_id, id)
      ) STRICT;
    `),
    );

    interface User {
      orgId: string;
      id: number;
      name: string;
    }

    const repository = new (class extends Repository<
      { orgId: string; id: number },
      User
    > {
      tableName = "users";
      idField = ["orgId", "id"];
    })(db);

    const returnedValue = await repository.save(emptyContext(), {
      orgId: "1",
      id: 1,
      name: "Apple",
    });

    assert.deepStrictEqual(returnedValue, { orgId: "1", id: 1, name: "Apple" });

    const insertedValue = await repository.findById(emptyContext(), {
      orgId: "1",
      id: 1,
    });

    assert.deepStrictEqual(insertedValue, { orgId: "1", id: 1, name: "Apple" });
  });
});
