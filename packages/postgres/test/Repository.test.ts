import { describe, it } from "node:test";
import * as assert from "node:assert";
import { createTestDB } from "../src";
import {
  AuditedEntity,
  AuditedRepository,
  emptyContext,
  Repository,
  sql,
  UserId,
} from "@tymber/common";

function contextForUser(userId: string) {
  const ctx = emptyContext();
  ctx.user = {
    id: userId as UserId,
    orgs: [],
  };
  return ctx;
}

describe("PostgreSQL - Repository", () => {
  it("should work", async () => {
    const db = await createTestDB();

    await db.run(
      emptyContext(),
      sql.rawStatement(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        first_name TEXT
      );
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

  it("should work (with audit)", async () => {
    const db = await createTestDB();

    await db.run(
      emptyContext(),
      sql.rawStatement(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ,
        created_by TEXT,
        updated_at TIMESTAMPTZ,
        updated_by TEXT,
        first_name TEXT
      );
    `),
    );

    interface User extends AuditedEntity {
      id: number;
      firstName: string;
    }

    const repository = new (class extends AuditedRepository<number, User> {
      tableName = "users";
    })(db);

    const returnedValue = await repository.save(contextForUser("1"), {
      firstName: "Bob",
    });

    assert.deepStrictEqual(returnedValue, {
      id: 1,
      firstName: "Bob",
      createdAt: returnedValue.createdAt,
      createdBy: "1",
      updatedAt: returnedValue.updatedAt,
      updatedBy: "1",
    });

    const insertedValue = await repository.findById(emptyContext(), 1);

    assert.deepStrictEqual(insertedValue, {
      id: 1,
      firstName: "Bob",
      createdAt: insertedValue.createdAt,
      createdBy: "1",
      updatedAt: insertedValue.updatedAt,
      updatedBy: "1",
    });
    assert.ok(insertedValue.createdAt instanceof Date);
    assert.ok(insertedValue.updatedAt instanceof Date);

    await repository.save(contextForUser("2"), {
      id: 1,
      firstName: "Alice",
    });

    const updatedValue = await repository.findById(emptyContext(), 1);

    assert.deepStrictEqual(updatedValue, {
      id: 1,
      firstName: "Alice",
      createdAt: insertedValue.createdAt,
      createdBy: "1",
      updatedAt: updatedValue.updatedAt,
      updatedBy: "2",
    });

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
      );
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

    db.close();
  });
});
