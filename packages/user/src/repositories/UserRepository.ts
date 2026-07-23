import {
  type Context,
  type Page,
  Repository,
  type ExternalUserId,
  type ConnectedUser,
  sql,
  camelToSnakeCase,
  escapeValue,
  type UserId,
  type UserRole,
  randomUUID,
  type GroupId,
} from "@tymber/core";

export interface User<UserData = any> {
  id: UserId;
  externalId: ExternalUserId;
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

  override async insert(ctx: Context, entity: Partial<User<UserData>>) {
    if (!entity.externalId) {
      entity.externalId = randomUUID() as ExternalUserId;
    }

    return super.insert(ctx, entity);
  }

  findByExternalId(ctx: Context, id: ExternalUserId) {
    return this.one(
      ctx,
      sql.select().from(this.tableName).where(sql.eq("external_id", id)),
    );
  }

  findByEmail(ctx: Context, email: string) {
    return this.one(
      ctx,
      sql.select().from(this.tableName).where(sql.eq("email", email)),
    );
  }

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
        .innerJoin("t_memberships m", { "m.user_id": "u.id" })
        .where({ "m.group_id": query.groupId });
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
          "u.id",
          "u.external_id",
          "u.first_name",
          "u.last_name",
          "u.role",
          "u.email",
          "m.role as group_role",
          "g.id AS group_id",
          "g.label AS group_label",
          "g.external_id AS external_group_id",
        ])
        .from("t_user_sessions s")
        .innerJoin("t_users u", { "u.id": "s.user_id" })
        .leftJoin("t_memberships m", { "m.user_id": "u.id" })
        .leftJoin("t_groups g", { "g.id": "m.group_id" })
        .where({ "s.id": sessionId })
        .where(sql.gt("s.expires_at", new Date())),
    );
    if (rows.length > 0) {
      const row = rows[0];
      return {
        id: row.id,
        externalId: row.external_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        role: row.role,
        groups: row.group_id
          ? rows.map((row: any) => ({
              id: row.group_id,
              externalId: row.external_group_id,
              label: row.group_label,
              role: row.group_role,
            }))
          : [],
      };
    }
  }
}
