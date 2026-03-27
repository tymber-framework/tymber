import {
  type AdminUserId,
  camelToSnakeCase,
  type Context,
  Repository,
  sql,
} from "@tymber/core";

export type RevisionId = number;

export interface Revision {
  id: RevisionId;

  createdAt: Date;
  createdBy: AdminUserId;

  values: string; // encrypted with aes-192-cbc
  comment: string;
}

export interface Query {
  page: number;
  size: number;
  sort: "created_at:asc" | "created_at:desc";
}

export class ConfigRepository extends Repository<RevisionId, Revision> {
  tableName = "t_config_revisions";

  public async findCurrentRevision(ctx: Context) {
    return this.one(
      ctx,
      sql.select().from(this.tableName).orderBy(["id DESC"]).limit(1),
    );
  }

  public async find(
    ctx: Context,
    query: Query,
    fields: Array<keyof Revision> = [],
  ) {
    const columns = fields.map((f) => `r.${camelToSnakeCase(f)}`);
    columns.push("u.username as created_by_username");

    const sqlQuery = sql
      .select(columns)
      .from(`${this.tableName} r`)
      .offset((query.page - 1) * query.size)
      .limit(query.size)
      .leftJoin("t_admin_users u", { "u.id": "r.created_by" });

    switch (query.sort) {
      case "created_at:asc":
        sqlQuery.orderBy(["r.created_at"]);
        break;
      case "created_at:desc":
        sqlQuery.orderBy(["r.created_at DESC"]);
        break;
    }

    const items = await this.all(ctx, sqlQuery);

    return {
      items: items.map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        createdBy: {
          id: item.createdBy,
          // @ts-expect-error additional field
          username: item.createdByUsername,
        },
        comment: item.comment,
      })),
    };
  }
}
