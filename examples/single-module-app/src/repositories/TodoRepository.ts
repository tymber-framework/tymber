import { Repository, type Context, sql } from "@tymber/core";

export interface Todo {
  id: number;
  createdAt: Date;
  title: string;
  completed: boolean;
}

export interface Query {
  completed?: boolean;
  sort: "created_at:asc" | "created_at:desc";
}

export class TodoRepository extends Repository<number, Todo> {
  tableName = "todos";

  findAll(ctx: Context, query: Query) {
    const sqlQuery = sql.select().from(this.tableName);

    if (query.completed !== undefined) {
      sqlQuery.where({ completed: query.completed });
    }

    switch (query.sort) {
      case "created_at:asc":
        sqlQuery.orderBy(["created_at"]);
        break;
      case "created_at:desc":
        sqlQuery.orderBy(["created_at DESC"]);
        break;
    }

    return this.all(ctx, sqlQuery);
  }
}
