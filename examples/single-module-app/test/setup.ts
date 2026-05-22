import { createTestDB } from "@tymber/postgres";
import {
  BaseTestContext,
  createTestApp,
  emptyContext,
  sql,
} from "@tymber/core";
import { TodoModule } from "../src/module";
import { Client } from "@tymber/client";

class TestClient extends Client {
  constructor(baseUrl: string) {
    super(baseUrl);
  }
}

export interface TestContext extends BaseTestContext {
  client: TestClient;
}

export async function setup(): Promise<TestContext> {
  try {
    const ctx = await createTestApp(() => createTestDB(), [TodoModule]);

    return {
      ...ctx,
      client: new TestClient(ctx.baseUrl),
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function createTodo(ctx: TestContext) {
  const rows = await ctx.db.query(
    emptyContext(),
    sql
      .insert()
      .into("todos")
      .values([
        {
          title: "test1",
          created_at: new Date(),
          completed: false,
        },
      ])
      .returning(["id"]),
  );

  return rows[0].id as number;
}
