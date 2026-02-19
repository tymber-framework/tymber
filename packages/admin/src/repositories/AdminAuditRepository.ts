import {
  type AdminUserId,
  camelToSnakeCase,
  type Context,
  type Page,
  Repository,
  sql,
} from "@tymber/core";

export interface AdminAuditLog {
  id: number;
  createdAt: Date;
  createdBy: AdminUserId;
  action: string;
  details: Record<string, any>;
}

interface AdminUser {
  id: AdminUserId;
  username: string;
}

export interface ExpandedAdminAuditLog {
  id: number;
  createdAt: Date;
  createdBy: AdminUser;
  action: string;
  details: Record<string, any>;
}

export interface Query {
  action?: string;
  createdBy?: AdminUserId;
  size: number;
  sort: "created_at:asc" | "created_at:desc";
}

export class AdminAuditRepository extends Repository<number, AdminAuditLog> {
  tableName = "t_admin_audit_logs";
  dateFields = ["createdAt"];
  jsonFields = ["details"];

  async log(
    ctx: Context,
    action: string,
    details: Record<string, any> = {},
  ): Promise<void> {
    await this.save(ctx, {
      createdAt: ctx.startedAt,
      createdBy: ctx.admin!.id,
      action,
      details,
    });
  }

  async find(
    ctx: Context,
    query: Query,
    fields: string[] = ["*"],
  ): Promise<Page<ExpandedAdminAuditLog>> {
    const columns = fields.map((field) => `l.${camelToSnakeCase(field)}`);
    columns.push("u.username as created_by_username");

    const sqlQuery = sql
      .select(columns)
      .from(this.tableName + " l")
      .limit(query.size)
      .innerJoin("t_admin_users u", { "u.id": "l.created_by" });

    if (query.action) {
      sqlQuery.where({ "l.action": query.action });
    }

    if (query.createdBy) {
      sqlQuery.where({ "l.created_by": query.createdBy });
    }

    switch (query.sort) {
      case "created_at:asc":
        sqlQuery.orderBy(["l.created_at"]);
        break;
      case "created_at:desc":
        sqlQuery.orderBy(["l.created_at DESC"]);
        break;
    }

    const items = (await this.all(ctx, sqlQuery)) as Array<
      AdminAuditLog & { createdByUsername: string }
    >;

    return {
      items: items.map((item) => ({
        id: item.id,
        createdAt: item.createdAt!,
        createdBy: {
          id: item.createdBy,
          username: item.createdByUsername,
        },
        action: item.action,
        details: item.details,
      })),
    };
  }

  async listDistinctActions(ctx: Context): Promise<string[]> {
    const rows = await this.db.query(
      ctx,
      sql.select(["action"]).distinct().from(this.tableName),
    );
    return rows.map((row) => row.action);
  }

  async listDistinctAdminUsers(ctx: Context): Promise<AdminUser[]> {
    return this.db.query(
      ctx,
      sql
        .select(["u.id", "u.username"])
        .distinct()
        .from(`${this.tableName} l`)
        .innerJoin("t_admin_users u", { "u.id": "l.created_by" }),
    );
  }
}
