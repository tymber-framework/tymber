import {
  camelToSnakeCase,
  type Context,
  type Page,
  Repository,
  sql,
} from "@tymber/common";

export interface Query {
  size: number;
  sort: "run_at:asc" | "run_at:desc";
}

interface Migration {
  module: string;
  id: number;
  name: string;
  runAt: Date;
}

export class MigrationRepository extends Repository<number, Migration> {
  tableName = "t_migrations";
  dateFields = ["runAt"];

  async find(
    ctx: Context,
    query: Query,
    fields: string[] = ["*"],
  ): Promise<Page<Migration>> {
    const columns = fields.map((field) => `${camelToSnakeCase(field)}`);
    const sqlQuery = sql.select(columns).from(this.tableName).limit(query.size);

    switch (query.sort) {
      case "run_at:asc":
        sqlQuery.orderBy(["run_at"]);
        break;
      case "run_at:desc":
        sqlQuery.orderBy(["run_at DESC"]);
        break;
    }

    const items = await this.all(ctx, sqlQuery);

    return {
      items,
    };
  }
}
