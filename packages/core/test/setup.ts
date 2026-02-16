import { Context, DB, Statement } from "../src";

class DummyDB extends DB {
  name: "dummy";

  query<T extends Record<string, any>>(
    ctx: Context,
    query: Statement,
  ): Promise<T[]> {
    throw "not implemented";
  }

  run(ctx: Context, query: Statement): Promise<{ affectedRows: number }> {
    throw "not implemented";
  }

  startTransaction(ctx: Context, fn: () => Promise<void>): Promise<void> {
    throw "not implemented";
  }

  createMigrationsTable(ctx: Context) {
    return Promise.resolve();
  }
}

export function createTestDB() {
  return new DummyDB();
}
