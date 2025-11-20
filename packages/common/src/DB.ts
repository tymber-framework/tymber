import { Component } from "./Component.js";
import { type Context } from "./Context.js";
import { Statement } from "./utils/sql.js";

export abstract class DB extends Component {
  public abstract readonly name: string;

  abstract query<T extends Record<string, any>>(
    ctx: Context,
    query: Statement,
  ): Promise<T[]>;

  abstract run(
    ctx: Context,
    query: Statement,
  ): Promise<{ affectedRows: number }>;

  abstract startTransaction(
    ctx: Context,
    fn: () => Promise<void>,
  ): void | Promise<void>;

  abstract createMigrationsTable(ctx: Context): Promise<void>;
}

export class DuplicateKeyError extends Error {}
