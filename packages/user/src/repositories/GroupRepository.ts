import {
  type Context,
  type GroupId,
  type Page,
  Repository,
  type UserId,
  sql,
  camelToSnakeCase,
  type InternalGroupId,
  escapeValue,
} from "@tymber/core";

export interface Group<GroupData = any> {
  internalId: InternalGroupId;
  id: GroupId;
  label?: string;
  data: GroupData;
}

export interface Query {
  q?: string;
  page: number;
  size: number;
  sort: "label:asc" | "label:desc";
  userId?: UserId;
}

export class GroupRepository<GroupData = any> extends Repository<
  GroupId,
  Group<GroupData>
> {
  tableName = "t_groups";
  jsonFields = ["data"];

  public async find(
    ctx: Context,
    query: Query,
    fields: Array<keyof Group> = [],
  ): Promise<Page<Group>> {
    const columns = fields.map((field) => `g.${camelToSnakeCase(field)}`);

    if (query.userId) {
      columns.push("m.role");
    }

    const sqlQuery = sql
      .select(columns)
      .from(`${this.tableName} g`)
      .offset((query.page - 1) * query.size)
      .limit(query.size);

    if (query.q) {
      const search = escapeValue(query.q.toLowerCase()) + "%";

      sqlQuery.where(sql.like("lower(label)", search, "~"));
    }

    if (query.userId) {
      sqlQuery
        .innerJoin("t_memberships m", { "m.group_id": "g.internal_id" })
        .innerJoin("t_users u", { "u.internal_id": "m.user_id" })
        .where({ "u.id": query.userId });
    }

    switch (query.sort) {
      case "label:asc":
        sqlQuery.orderBy(["lower(g.label)", "g.id"]);
        break;
      case "label:desc":
        sqlQuery.orderBy(["lower(g.label) desc", "g.id DESC"]);
        break;
    }

    const items = await this.all(ctx, sqlQuery);

    return {
      items,
    };
  }
}
