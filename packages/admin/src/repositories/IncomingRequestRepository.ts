import {
  type Brand,
  type Context,
  Repository,
  sql,
  type UserId,
} from "@tymber/core";

export type IncomingRequestId = Brand<string, "IncomingRequestId">;

export interface IncomingRequest {
  id: IncomingRequestId;
  createdAt: Date;
  requestId: string;
  method: string;
  path: string;
  matchedRoute?: string;
  userId?: UserId;
  status: number;
  durationInMs: number;
}

export interface FindQuery {
  size: number;
  sort: "created_at:asc" | "created_at:desc";

  from?: Date;
  to?: Date;
  requestId?: string;
  methods?: string[];
  statusList?: number[];
  matchedRoute?: string;
  minDurationInMs?: number;
}

export class IncomingRequestRepository extends Repository<
  IncomingRequestId,
  IncomingRequest
> {
  protected tableName = "t_incoming_requests";
  protected dateFields = ["createdAt"];

  async log(
    ctx: Context,
    requests: Omit<IncomingRequest, "id">[],
  ): Promise<void> {
    if (requests.length === 0) return;

    await this.db.query(
      ctx,
      sql
        .insert()
        .into(this.tableName)
        .values(requests.map((req) => this.toRow(req))),
    );
  }

  async find(ctx: Context, query: FindQuery) {
    const sqlQuery = sql.select().from(this.tableName).limit(query.size);

    if (query.from) {
      sqlQuery.where(sql.gte("created_at", query.from));
    }

    if (query.to) {
      sqlQuery.where(sql.lte("created_at", query.to));
    }

    if (query.requestId) {
      sqlQuery.where({ request_id: query.requestId });
    }

    if (query.methods !== undefined) {
      sqlQuery.where(sql.in("method", query.methods));
    }

    if (query.statusList !== undefined) {
      sqlQuery.where(sql.in("status", query.statusList));
    }

    if (query.matchedRoute) {
      sqlQuery.where({ matched_route: query.matchedRoute });
    }

    if (query.minDurationInMs !== undefined) {
      sqlQuery.where(sql.gte("duration_in_ms", query.minDurationInMs));
    }

    switch (query.sort) {
      case "created_at:asc":
        sqlQuery.orderBy(["created_at", "id"]);
        break;
      case "created_at:desc":
        sqlQuery.orderBy(["created_at desc", "id DESC"]);
        break;
    }

    const items = await this.all(ctx, sqlQuery);

    return {
      items,
    };
  }

  deleteEntriesOlderThan(ctx: Context, retentionInDays: number) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - retentionInDays);

    return this.db.query(
      ctx,
      sql.deleteFrom(this.tableName).where(sql.lte("created_at", threshold)),
    );
  }
}
