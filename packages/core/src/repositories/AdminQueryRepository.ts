import {
  type AdminAuditedEntity,
  AdminAuditedRepository,
  type AdminUserId,
  camelToSnakeCase,
  type Context,
  escapeValue,
  type Page,
  sql,
} from "@tymber/common";

interface AdminQuery extends AdminAuditedEntity {
  id: number;
  query: string;
  comment: string;
  affectedRows: number;
}

interface ExpandedAdminQuery {
  id: number;
  createdBy: {
    id: AdminUserId;
    username: string;
  };
  createdAt: Date;
  query: string;
  comment: string;
  affectedRows: number;
}

export interface Query {
  q?: string;
  size: number;
  sort: "id:asc" | "id:desc" | "created_at:asc" | "created_at:desc";
}

export class AdminQueryRepository extends AdminAuditedRepository<
  number,
  AdminQuery
> {
  tableName = "t_admin_queries";

  async dryRunQuery(ctx: Context, query: string) {
    let affectedRows = 0;

    try {
      await this.db.startTransaction(ctx, async () => {
        const result = await this.db.run(ctx, sql.rawStatement(query));

        affectedRows = result.affectedRows;

        throw "trigger rollback";
      });
    } catch (e) {
      if (e !== "trigger rollback") {
        throw e;
      }
    }

    return affectedRows;
  }

  async runQuery(ctx: Context, query: string, comment: string) {
    let affectedRows = 0;

    await this.db.startTransaction(ctx, async () => {
      const result = await this.db.run(ctx, sql.rawStatement(query));
      affectedRows = result.affectedRows;

      await this.save(ctx, { query, comment, affectedRows });
    });

    return affectedRows;
  }

  async find(
    ctx: Context,
    query: Query,
    fields: string[] = ["*"],
  ): Promise<Page<ExpandedAdminQuery>> {
    const columns = fields.map((field) => `q.${camelToSnakeCase(field)}`);
    columns.push("u.username as created_by_username");

    const sqlQuery = sql
      .select(columns)
      .from(this.tableName + " q")
      .limit(query.size)
      .leftJoin("t_admin_users u", { "u.id": "q.created_by" });

    if (query.q) {
      sqlQuery.where(
        sql.like("q.comment", "%" + escapeValue(query.q) + "%", "~"),
      );
    }

    switch (query.sort) {
      case "id:asc":
        sqlQuery.orderBy(["q.id"]);
        break;
      case "id:desc":
        sqlQuery.orderBy(["q.id DESC"]);
        break;
      case "created_at:asc":
        sqlQuery.orderBy(["q.created_at"]);
        break;
      case "created_at:desc":
        sqlQuery.orderBy(["q.created_at DESC"]);
        break;
    }

    const items = await this.all(ctx, sqlQuery);

    return {
      items: items.map((item) => ({
        id: item.id,
        createdAt: item.createdAt!,
        createdBy: {
          id: item.createdBy!,
          // @ts-expect-error additional field
          username: item.createdByUsername,
        },
        query: item.query,
        comment: item.comment,
        affectedRows: item.affectedRows,
      })),
    };
  }
}
