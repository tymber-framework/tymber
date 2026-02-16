---
toc_max_heading_level: 4
---

# Repository

A `Repository` is a special [`Component`](./component.md) that is responsible for retrieving data from a database.

It can be used in conjunction with the built-in [`SQL query builder`](../utils/sql-query-builder.md) to build complex queries.

## Definition

```ts
import { Repository } from "@tymber/common";

interface TodoItem {
    id: number;
    title: string;
    description: string;
    dueDate: Date,
    completed: boolean;
}

export class TodoRepository extends Repository<number, TodoItem> {
    tableName = "todos";
}
```

## Registration

```ts
import { type Module, type AppInit } from "@tymber/common";
import { TodoRepository } from "./repositories/TodoRepository";

export const MyModule: Module = {
    name: "my-module",
    version: "1.2.3",

    init(app: AppInit) {
        app.component(TodoRepository);
    },
};
```

## API

### Public methods

#### `findById(ctx, id)`

Find a single entity (or `undefined`) by its ID:

```ts
const item = await todoRepository.findById(ctx, todoId);
```

#### `deleteById(ctx, id)`

Delete a single entity by its ID:

```ts
try {
    await todoRepository.deleteById(ctx, todoId);
} catch (e) {
    if (e instanceof EntityNotFoundError) {
        // ...
    } else {
        throw e;
    }
}
```

#### `save(ctx, entity)`

Upsert the entity:

```ts
const { id } = await todoRepository.save(ctx, todoItem);
```

The entity is converted to a row with the [`toRow()`](#torowentity) method.

#### `startTransaction(ctx)`

Start a new transaction:

```ts
await todoRepository.startTransaction(ctx, async () => {
    // ...
});
```

If the callback throws an error, all changes are rolled back.

### Protected methods

#### `all(ctx, statement)`

Return all entities matching the given `statement`:

```ts
interface Query {
    page: number;
    size: number;
    sort:
        | "label:asc"
        | "label:desc";
}

export class TodoRepository extends Repository<number, TodoItem> {
    tableName = "todos";

    find(ctx: Context, query: Query) {
        const sqlQuery = sql
            .select()
            .from(this.tableName)
            .offset((query.page - 1) * query.size)
            .limit(query.size);

        switch (query.sort) {
            case "label:asc":
                sqlQuery.orderBy(["lower(label)"]);
                break;
            case "label:desc":
                sqlQuery.orderBy(["lower(label) desc"]);
                break;
        }

        return this.all(ctx, sqlQuery);
    }
}
```

The `statement` argument is a SQL query built with Tymber built-in [SQL query builder](../utils/sql-query-builder.md)

Each row is converted to an entity with the [`toEntity()`](#toentityrow) method.

#### `one(ctx, statement)`

Return one single entity (or `undefined`) matching the given `statement`:

```ts
export class TodoRepository extends Repository<number, TodoItem> {
    tableName = "todos";

    findOneByLabel(ctx: Context, label: string) {
        const query = sql
            .select()
            .from(this.tableName)
            .where({ label });

        return this.one(ctx, query);
    }
}
```

#### `count(ctx, statement)`

Return the number of entities matching the given `statement`:

```ts
export class TodoRepository extends Repository<number, TodoItem> {
    tableName = "todos";

    find(ctx: Context) {
        const countQuery = sql
            .select([sql.raw("COUNT(*) as count")])
            .from(this.tableName);

        return this.count(ctx, countQuery);
    }
}
```

#### `toRow(entity)`

Convert an entity to a row. By default, each field is converted from camel case to snake case.

This method can be overridden to customize the conversion:

```ts
export class TodoRepository extends Repository<number, TodoItem> {
    tableName = "todos";

    override toRow(entity: Partial<TodoItem>) {
        const row = super.toRow(entity);
        // ...
        return row;
    }
}
```

#### `toEntity(row)`

Convert a row to an entity. By default, each field is converted from snake case to camel case.

This method can be overridden to customize the conversion:

```ts
export class TodoRepository extends Repository<number, TodoItem> {
    tableName = "todos";

    override toEntity(row: Record<string, any>) {
        const entity = super.toEntity(row);
        // ...
        return entity;
    }
}
```

#### `db`

A DB instance is automatically injected into each repository:

- `db.run(ctx, statement)` runs a SQL query and returns the number of affected rows
- `db.query(ctx, statement)` runs a SQL query and returns the result as an array of rows

```ts
export class TodoRepository extends Repository<number, TodoItem> {
    tableName = "todos";

    async deleteExpiredEntries(ctx: Context) {
        const { affectedRows } = await this.db.run(
            ctx,
            sql
                .deleteFrom(this.tableName)
                .where(sql.raw("due_date < NOW() - INTERVAL '30 days'")),
        );

        return affectedRows;
    }
}
```
