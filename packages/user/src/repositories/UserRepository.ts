import {
  type Context,
  type GroupId,
  type Page,
  Repository,
  type UserId,
  type ConnectedUser,
  sql,
  camelToSnakeCase,
  escapeValue,
  type InternalUserId,
  EntityNotFoundError,
  type InternalGroupId,
} from "@tymber/core";
import { randomUUID } from "node:crypto";

type AuthType = "magic link" | "password";

export type SessionId = string;

export interface User {
  internalId: InternalUserId;
  id: UserId;
  firstName?: string;
  lastName?: string;
  authType?: AuthType;
  email?: string;
  password?: string;
}

export const USER_ROLES: number[] = [0];

export interface UserQuery {
  q?: string;
  page: number;
  size: number;
  groupId?: GroupId;
  sort:
    | "first_name:asc"
    | "first_name:desc"
    | "last_name:asc"
    | "last_name:desc"
    | "email:asc"
    | "email:desc";
}

export class UserRepository extends Repository<UserId, User> {
  tableName = "t_users";

  public async find(
    ctx: Context,
    query: UserQuery,
    fields: string[] = ["*"],
  ): Promise<Page<User>> {
    const columns = fields.map((field) => `u.${camelToSnakeCase(field)}`);

    if (query.groupId) {
      columns.push("r.role");
    }

    const sqlQuery = sql
      .select(columns)
      .from(`${this.tableName} u`)
      .offset((query.page - 1) * query.size)
      .limit(query.size);

    if (query.q) {
      const search = escapeValue(query.q.toLowerCase()) + "%";

      sqlQuery.where(
        sql.or([
          sql.like("lower(u.first_name)", search, "~"),
          sql.like("lower(u.last_name)", search, "~"),
          sql.like("u.email", search, "~"),
        ]),
      );
    }

    if (query.groupId) {
      sqlQuery
        .innerJoin("t_user_roles r", { "r.user_id": "u.internal_id" })
        .innerJoin("t_groups g", { "r.group_id": "g.internal_id" })
        .where({ "g.id": query.groupId });
    }

    switch (query.sort) {
      case "first_name:asc":
        sqlQuery.orderBy(["lower(first_name)", "lower(last_name)"]);
        break;
      case "first_name:desc":
        sqlQuery.orderBy(["lower(first_name) desc", "lower(last_name) desc"]);
        break;
      case "last_name:asc":
        sqlQuery.orderBy(["lower(last_name)", "lower(first_name)"]);
        break;
      case "last_name:desc":
        sqlQuery.orderBy(["lower(last_name) desc", "lower(first_name) desc"]);
        break;
      case "email:asc":
        sqlQuery.orderBy(["email", "id"]);
        break;
      case "email:desc":
        sqlQuery.orderBy(["email desc", "id desc"]);
        break;
    }

    const items = await this.all(ctx, sqlQuery);

    return {
      items,
    };
  }

  async createSession(ctx: Context, userId: UserId): Promise<SessionId> {
    const sessionId = randomUUID();

    const internalUserId = await this.getInternalUserId(ctx, userId);

    await this.db.query(
      ctx,
      sql
        .insert()
        .into("t_user_sessions")
        .values([
          {
            id: sessionId,
            user_id: internalUserId,
          },
        ]),
    );

    return sessionId;
  }

  private async getInternalUserId(
    ctx: Context,
    userId: UserId,
  ): Promise<InternalUserId> {
    const result = await this.db.query(
      ctx,
      sql.select(["internal_id"]).from(this.tableName).where({
        id: userId,
      }),
    );

    if (result.length === 0) {
      throw new EntityNotFoundError();
    }

    return result[0].internal_id as InternalUserId;
  }

  private async getInternalGroupId(
    ctx: Context,
    groupId: GroupId,
  ): Promise<InternalGroupId> {
    const result = await this.db.query(
      ctx,
      sql.select(["internal_id"]).from("t_groups").where({
        id: groupId,
      }),
    );

    if (result.length === 0) {
      throw new EntityNotFoundError();
    }

    return result[0].internal_id as InternalGroupId;
  }

  public async findBySessionId(
    ctx: Context,
    sessionId: string,
  ): Promise<ConnectedUser | undefined> {
    const rows = await this.db.query(
      ctx,
      sql
        .select([
          "u.internal_id",
          "u.id",
          "u.first_name",
          "u.last_name",
          "u.email",
          "r.role",
          "g.id AS group_id",
          "g.label AS group_label",
          "g.internal_id AS internal_group_id",
        ])
        .from("t_user_sessions s")
        .innerJoin("t_users u", { "u.internal_id": "s.user_id" })
        .leftJoin("t_user_roles r", { "r.user_id": "u.internal_id" })
        .leftJoin("t_groups g", { "g.internal_id": "r.group_id" })
        .where({ "s.id": sessionId }),
    );
    if (rows.length > 0) {
      const row = rows[0];
      return {
        internalId: row.internal_id,
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        groups: row.group_id
          ? rows.map((row: any) => ({
              internalId: row.internal_group_id,
              id: row.group_id,
              label: row.group_label,
              role: row.role,
            }))
          : [],
      };
    }
  }

  async deleteSession(ctx: Context, sessionId: SessionId) {
    await this.db.query(
      ctx,
      sql.deleteFrom("t_user_sessions").where({ id: sessionId }),
    );
  }

  async addUserToGroup(
    ctx: Context,
    userId: UserId,
    groupId: GroupId,
    role: number,
  ) {
    const [internalUserId, internalGroupId] = await Promise.all([
      this.getInternalUserId(ctx, userId),
      this.getInternalGroupId(ctx, groupId),
    ]);

    await this.db.run(
      ctx,
      sql
        .insert()
        .into("t_user_roles")
        .values([
          {
            user_id: internalUserId,
            group_id: internalGroupId,
            role,
          },
        ]),
    );
  }

  async removeUserFromGroup(ctx: Context, userId: UserId, groupId: GroupId) {
    const [internalUserId, internalGroupId] = await Promise.all([
      this.getInternalUserId(ctx, userId),
      this.getInternalGroupId(ctx, groupId),
    ]);

    const res = await this.db.run(
      ctx,
      sql.deleteFrom("t_user_roles").where({
        user_id: internalUserId,
        group_id: internalGroupId,
      }),
    );

    if (res.affectedRows === 0) {
      throw new Error(`User ${userId} is not in group ${groupId}`);
    }
  }
}
