import {
  type Context,
  createDebug,
  DB,
  DuplicateKeyError,
  sql,
  Statement,
} from "@tymber/common";
import * as pg from "pg";

const debug = createDebug("postgres");

// ref: https://www.postgresql.org/docs/current/errcodes-appendix.html
const UNIQUE_VIOLATION_ERROR_CODE = "23505";

export class PostgresDB extends DB {
  override readonly name = "postgres";

  constructor(private readonly pgPool: pg.Pool) {
    super();
  }

  override run(ctx: Context, query: Statement) {
    const { text, values } = query.build();

    debug("query: %s", text);

    return ((ctx.tx as pg.PoolClient) || this.pgPool)
      .query(text, values)
      .then((res) => ({ affectedRows: res.rowCount ?? 0 }))
      .catch((e) => {
        if (e.code === UNIQUE_VIOLATION_ERROR_CODE) {
          throw new DuplicateKeyError(e.message);
        } else {
          throw e;
        }
      });
  }

  override query<T extends Record<string, any>>(
    ctx: Context,
    query: Statement,
  ) {
    const { text, values } = query.build();

    debug("query: %s", text);

    return ((ctx.tx as pg.PoolClient) || this.pgPool)
      .query(text, values)
      .then((res) => res.rows as T[])
      .catch((e) => {
        if (e.code === UNIQUE_VIOLATION_ERROR_CODE) {
          throw new DuplicateKeyError(e.message);
        } else {
          throw e;
        }
      });
  }

  override async startTransaction(ctx: Context, fn: () => Promise<void>) {
    if (ctx.tx) {
      throw new Error("nested transactions are not supported");
    }

    const client = (ctx.tx = await this.pgPool.connect());

    try {
      debug("starting transaction");
      await client.query("BEGIN");

      await fn();

      debug("committing transaction");
      await client.query("COMMIT");
    } catch (e) {
      debug("rolling back transaction due to %s", e as Error);
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
      ctx.tx = undefined;
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
            run_at TIMESTAMPTZ,

            PRIMARY KEY (module, id)
        );
    `),
    );
  }
}
