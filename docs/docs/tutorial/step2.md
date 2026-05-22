# Step 2: Database setup

Tymber provides a lightweight database migrations system, allowing you to easily manage database schema changes over time.

Full documentation: [Database migrations](../getting-started/database-migrations)

### Initial migration

Let's start by creating a table to store our todos.

First, create a `migrations` directory:

```bash
mkdir -p assets/migrations
```

And a migration file named `0001-init.sql` with the following content:

```sql title="assets/migrations/0001-init.sql"
CREATE TABLE todos
(
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    completed  INTEGER NOT NULL,
    created_at INTEGER NOT NULL
) STRICT;
```

The migration is applied automatically when the application starts.

### Repository

In Tymber, a **Repository** is a component dedicated to handling database operations.

Common methods provided by the `Repository` class include:

- `findById(ctx, id)`: Fetches a single entity by its primary key.
- `insert(ctx, entity)`: Persists a new entity to the database.
- `update(ctx, entity)`: Updates an existing entity.

Full documentation: [Repository](../building-blocks/repository.md)

Let's create a repository to manage our items:

```ts title="src/repositories/TodoRepository.ts"
import { Repository } from "@tymber/core";

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export class TodoRepository extends Repository<number, Todo> {
  tableName = "todos";
  dateFields = ["createdAt"];
}
```

:::info

Since SQLite does not have a `TIMESTAMP` type, we need to specify the `dateFields` property to automatically convert them to `Date` objects.

:::

Let's now register our repository:

```ts title="src/module.ts"
import { type Module } from "@tymber/core";
import { TodoRepository } from "./repositories/TodoRepository.js";

export const TodoModule: Module = {
  // [...]
  init(app) {
    app.component(TodoRepository);
  }
};
```

## Ending note

That's it for the database setup! You should now have the following directory structure:

```text
my-todo-app/
├── assets/
│   └── migrations/
│       └── 0001-init.sql
├── package.json
├── src/
│   ├── entrypoint.ts
│   ├── module.ts
│   └── repositories/
│       └── TodoRepository.ts
└── tsconfig.json
```
