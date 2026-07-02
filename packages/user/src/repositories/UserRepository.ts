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
  type UserRole,
} from "@tymber/core";

export interface User<UserData = any> {
  internalId: InternalUserId;
  id: UserId;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: UserRole;
  data: UserData;
}

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

export class UserRepository<UserData = any> extends Repository<
  UserId,
  User<UserData>
> {
  tableName = "t_users";
  jsonFields = ["data"];

  public async find(
    ctx: Context,
    query: UserQuery,
    fields: Array<keyof User> = [],
  ): Promise<Page<User>> {
    const columns = fields.map((field) => `u.${camelToSnakeCase(field)}`);

    if (query.groupId) {
      columns.push("m.role");
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
        .innerJoin("t_memberships m", { "m.user_id": "u.internal_id" })
        .innerJoin("t_groups g", { "g.internal_id": "m.group_id" })
        .where({ "g.id": query.groupId });
    }

    switch (query.sort) {
      case "first_name:asc":
        sqlQuery.orderBy(["lower(u.first_name)", "lower(u.last_name)"]);
        break;
      case "first_name:desc":
        sqlQuery.orderBy([
          "lower(u.first_name) desc",
          "lower(u.last_name) desc",
        ]);
        break;
      case "last_name:asc":
        sqlQuery.orderBy(["lower(u.last_name)", "lower(u.first_name)"]);
        break;
      case "last_name:desc":
        sqlQuery.orderBy([
          "lower(u.last_name) desc",
          "lower(u.first_name) desc",
        ]);
        break;
      case "email:asc":
        sqlQuery.orderBy(["u.email", "u.id"]);
        break;
      case "email:desc":
        sqlQuery.orderBy(["u.email desc", "u.id desc"]);
        break;
    }

    const items = await this.all(ctx, sqlQuery);

    return {
      items,
    };
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
          "u.role",
          "u.email",
          "m.role as group_role",
          "g.id AS group_id",
          "g.label AS group_label",
          "g.internal_id AS internal_group_id",
        ])
        .from("t_user_sessions s")
        .innerJoin("t_users u", { "u.internal_id": "s.user_id" })
        .leftJoin("t_memberships m", { "m.user_id": "u.internal_id" })
        .leftJoin("t_groups g", { "g.internal_id": "m.group_id" })
        .where({ "s.id": sessionId })
        .where(sql.gt("s.expires_at", new Date())),
    );
    if (rows.length > 0) {
      const row = rows[0];
      return {
        internalId: row.internal_id,
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        role: row.role,
        groups: row.group_id
          ? rows.map((row: any) => ({
              internalId: row.internal_group_id,
              id: row.group_id,
              label: row.group_label,
              role: row.group_role,
            }))
          : [],
      };
    }
  }
}
