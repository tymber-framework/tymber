import {
  type AdminAuditedEntity,
  AdminAuditedRepository,
  type AdminUserId,
  type Brand,
  camelToSnakeCase,
  type Context,
  escapeValue,
  type Page,
  sql,
} from "@tymber/common";
import { randomUUID } from "node:crypto";

const { insert, select, deleteFrom } = sql;

export interface Query {
  q?: string;
  size: number;
  sort: "id:asc" | "id:desc" | "username:asc" | "username:desc";
}

export interface AdminUser extends AdminAuditedEntity {
  id: AdminUserId;

  username: string;
  password: string;
  isTemporaryPassword: boolean;
}

export type AdminSessionId = Brand<string, "AdminSessionId">;

export class AdminUserRepository extends AdminAuditedRepository<
  AdminUserId,
  AdminUser
> {
  tableName = "t_admin_users";

  async findByUsername(
    ctx: Context,
    username: string,
    fields: string[] = ["*"],
  ): Promise<AdminUser | undefined> {
    return this.one(
      ctx,
      select(fields).from(this.tableName).where({ username }),
    );
  }

  async createSession(
    ctx: Context,
    adminUserId: AdminUserId,
  ): Promise<AdminSessionId> {
    const sessionId = randomUUID();

    await this.db.query(
      ctx,
      insert()
        .into("t_admin_sessions")
        .values([
          {
            id: sessionId,
            user_id: adminUserId,
            // TODO expires_at
          },
        ]),
    );

    return sessionId as AdminSessionId;
  }

  async deleteSession(ctx: Context, sessionId: AdminSessionId) {
    await this.db.query(
      ctx,
      deleteFrom("t_admin_sessions").where({ id: sessionId }),
    );
  }

  findBySessionId(ctx: Context, sessionId: AdminSessionId) {
    return this.one(
      ctx,
      select(["a.id", "a.username", "a.is_temporary_password"])
        .from("t_admin_sessions s")
        .innerJoin("t_admin_users a", { "a.id": "s.user_id" })
        .where({ "s.id": sessionId }),
    );
  }

  async find(
    ctx: Context,
    query: Query,
    fields: string[] = ["*"],
  ): Promise<Page<AdminUser>> {
    const columns = fields.map((field) => `${camelToSnakeCase(field)}`);
    const sqlQuery = sql.select(columns).from(this.tableName).limit(query.size);

    if (query.q) {
      sqlQuery.where(sql.like("username", escapeValue(query.q) + "%", "~"));
    }

    switch (query.sort) {
      case "id:asc":
        sqlQuery.orderBy(["id"]);
        break;
      case "id:desc":
        sqlQuery.orderBy(["id DESC"]);
        break;
      case "username:asc":
        sqlQuery.orderBy(["username"]);
        break;
      case "username:desc":
        sqlQuery.orderBy(["username DESC"]);
        break;
    }

    const items = await this.all(ctx, sqlQuery);

    return {
      items,
    };
  }
}
