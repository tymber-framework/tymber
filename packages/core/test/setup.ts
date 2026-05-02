import { Context, DB, Statement } from "../src";

class DummyDB extends DB {
  name: "dummy";

  query<T extends Record<string, any>>(
    ctx: Context,
    query: Statement,
  ): Promise<T[]> {
    throw "not implemented";
  }

  exec(ctx: Context, query: Statement): Promise<void> {
    throw "not implemented";
  }

  run(ctx: Context, query: Statement): Promise<{ affectedRows: number }> {
    throw "not implemented";
  }

  startTransaction<T>(ctx: Context, fn: () => Promise<T>): Promise<T> {
    throw "not implemented";
  }

  createMigrationsTable(ctx: Context) {
    return Promise.resolve();
  }
}

export function createTestDB() {
  return new DummyDB();
}
