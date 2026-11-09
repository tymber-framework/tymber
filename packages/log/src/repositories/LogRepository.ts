import {
  Repository,
  type Context,
  sql,
  type LogEntry,
  LogLevel,
  type Brand,
} from "@tymber/core";
import { format } from "node:util";

export type LogId = Brand<bigint, "LogId">;

export interface Log {
  id: LogId;
  level: LogLevel;
  component?: string;
  message: string;
  createdAt: Date;
}

export interface ListLogsQuery {
  page: number;
  size: number;
  sort: "created_at:asc" | "created_at:desc";

  levels?: LogLevel[];
  components?: string[];
  from?: Date;
  to?: Date;
}

export class LogRepository extends Repository<LogId, Log> {
  protected tableName = "t_logs";
  protected dateFields = ["createdAt"];

  async insertBatch(ctx: Context, entries: LogEntry[]) {
    const rows = entries.map((entry) => ({
      created_at: entry.timestamp,
      level: entry.level,
      component: entry.component,
      message: format(entry.message, ...entry.args),
    }));

    await this.db.query(ctx, sql.insert().into(this.tableName).values(rows));
  }

  async listLogs(ctx: Context, query: ListLogsQuery) {
    let sqlQuery = sql
      .select()
      .from(this.tableName)
      .offset((query.page - 1) * query.size)
      .limit(query.size);

    switch (query.sort) {
      case "created_at:asc":
        sqlQuery = sqlQuery.orderBy(["created_at", "id"]);
        break;
      case "created_at:desc":
        sqlQuery = sqlQuery.orderBy(["created_at DESC", "id DESC"]);
        break;
    }

    if (query.levels !== undefined && query.levels.length > 0) {
      sqlQuery = sqlQuery.where(sql.in("level", query.levels));
    }

    if (query.components !== undefined && query.components.length > 0) {
      sqlQuery = sqlQuery.where(sql.in("component", query.components));
    }

    if (query.from) {
      sqlQuery = sqlQuery.where(sql.gte("created_at", query.from));
    }

    if (query.to) {
      sqlQuery = sqlQuery.where(sql.lte("created_at", query.to));
    }

    const items = await this.all(ctx, sqlQuery);

    return {
      items,
    };
  }

  deleteOldLogs(ctx: Context, olderThan: Date) {
    return this.db.run(
      ctx,
      sql.deleteFrom(this.tableName).where(sql.lt("created_at", olderThan)),
    );
  }
}
