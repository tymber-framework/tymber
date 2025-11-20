import {
  type Context,
  createDebug,
  DB,
  DuplicateKeyError,
  sql,
  Statement,
} from "@tymber/common";
import { type Database } from "sqlite";

const debug = createDebug("sqlite");

export class SQLiteDB extends DB {
  override readonly name = "sqlite";

  constructor(private readonly db: Database) {
    super();
    sql.setOption("placeholder", "?");
  }

  override async run(_ctx: Context, query: Statement) {
    const { text, values } = query.build();

    debug("query: %s", text);

    try {
      if (values.length > 0) {
        const res = await this.db.run(text, values);
        return {
          affectedRows: res.changes ?? 0,
        };
      } else {
        await this.db.exec(text);
        return {
          affectedRows: 0,
        };
      }
    } catch (e) {
      if (
        e instanceof Error &&
        (e as Error & { errno?: number }).errno === 19
      ) {
        throw new DuplicateKeyError(e.message);
      } else {
        throw e;
      }
    }
  }

  override query<T extends Record<string, any>>(
    _ctx: Context,
    query: Statement,
  ) {
    const { text, values } = query.build();

    debug("query: %s", text);

    try {
      return this.db.all<T[]>(text, values);
    } catch (e) {
      if (
        e instanceof Error &&
        (e as Error & { errno?: number }).errno === 19
      ) {
        throw new DuplicateKeyError(e.message);
      } else {
        throw e;
      }
    }
  }

  override async startTransaction(_ctx: Context, fn: () => Promise<void>) {
    try {
      debug("starting transaction");
      await this.db.run("BEGIN");

      await fn();

      debug("committing transaction");
      await this.db.run("COMMIT");
    } catch (e) {
      debug("rolling back transaction due to %s", e as Error);
      await this.db.run("ROLLBACK");
      throw e;
    }
  }

  override async createMigrationsTable(ctx: Context) {
    await this.run(
      ctx,
      sql.rawStatement(`
        CREATE TABLE IF NOT EXISTS migrations
        (
            module TEXT,
            id     INTEGER,
            name   TEXT,
            run_at INTEGER,

            PRIMARY KEY (module, id)
        ) STRICT;
    `),
    );
  }
}
