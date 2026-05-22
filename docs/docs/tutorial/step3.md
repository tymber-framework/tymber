import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Step 3: CRUD endpoints

Now that the database is set up, we can create the endpoints to handle the classic CRUD (**C**reate/**R**ead/**U**pdate/**D**elete) operations.

An endpoint is a component that handles an HTTP request and returns an HTTP response, typically JSON.

Full documentation: [Endpoint](../building-blocks/endpoint.md)

## Create endpoint

### Definition

Let's create our first endpoint:

```ts title="src/endpoints/CreateTodo.ts"
import { Endpoint, type HttpContext, INJECT } from "@tymber/core";
import { TodoRepository } from "../repositories/TodoRepository.js";
import { type JSONSchemaType } from "ajv";

interface Payload {
  title: string;
}

export class CreateTodo extends Endpoint {
  // tell Tymber to inject an instance of the TodoRepository
  static [INJECT] = [TodoRepository];

  constructor(private readonly todoRepository: TodoRepository) {
    // the constructor receives the dependencies injected by Tymber
    // "private readonly" means you can use "this.todoRepository" inside the class
    super();
  }

  // the expected structure of the request body (using JSON Schema)
  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1, maxLength: 100 },
    },
    required: ["title"],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload>) {
    // at this point, the request body is validated and matches the `Payload` interface
    // if the validation fails, the endpoint will return a "HTTP 400 Bad Request" response
    // with the validation errors
    const { title } = ctx.payload;

    // use the TodoRepository to insert the entity into the database
    const todo = await this.todoRepository.insert(ctx, {
      title,
      createdAt: new Date(),
      completed: false,
    });

    // return a "HTTP 201 Created" response with the newly created entity
    return Response.json(todo, { status: 201 });
  }
}
```

:::note

Under the hood, Tymber uses the Ajv library to validate the JSON schemas.

References:

- https://ajv.js.org/
- https://json-schema.org/

:::

### Registration

Let's register our endpoint:

```ts title="src/module.ts"
import { type Module } from "@tymber/core";
import { TodoRepository } from "./repositories/TodoRepository.js";
import { CreateTodo } from "./endpoints/CreateTodo.js";

export const TodoModule: Module = {
  // [...]
  init(app) {
    app.component(TodoRepository);

    app.endpoint("POST", "/api/todos", CreateTodo);
  },
};
```

### Testing

Now, let's test our endpoint. Create a `setup.ts` file in the `test/` directory:

```ts title="test/setup.ts"
import { createTestDB } from "@tymber/sqlite";
import { type BaseTestContext, createTestApp } from "@tymber/core";
import { TodoModule } from "../src/module.js";
import { Client } from "@tymber/client";

// @tymber/client provides a light wrapper around the fetch() method, including:
// - query parameters serialization
// - body serialization and deserialization
class TestClient extends Client {
  constructor(baseUrl: string) {
    super(baseUrl);
  }
}

export interface TestContext extends BaseTestContext {
  client: TestClient;
}

export async function setup(): Promise<TestContext> {
  try {
    // create the application with our module and a database suited for testing in parallel
    // for SQLite, this will create an in-memory DB for each test process
    // for PostgreSQL, this will create a distinct schema for each test process
    const ctx = await createTestApp(() => createTestDB(), [TodoModule]);

    // you can put any initialization code here, like inserting test data into the database

    return {
      ...ctx,
      client: new TestClient(ctx.baseUrl),
    };
  } catch (e) {
    // you can put a breakpoint here to catch any initialization error
    console.error(e);
    throw e;
  }
}
```

The `setup()` method is then called in our `before` hook:

<Tabs groupId="package-manager">
  <TabItem value="npm" default>

```ts title="test/endpoints/CreateTodo.test.ts"
import { describe, it, before, after } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";

describe("CreateTodo", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should create a todo item", async () => {
    const res = await ctx.client.fetch({
      method: "POST",
      path: "/api/todos",
      payload: {
        title: "test1",
      },
    });

    assert.equal(res.status, 201);
    assert.partialDeepStrictEqual(res.body, {
      title: "test1",
      completed: false,
    });
  });

  it("should reject a todo item without a title", async () => {
    const res = await ctx.client.fetch({
      method: "POST",
      path: "/api/todos",
      payload: {
        id: 123,
      },
    });

    assert.equal(res.status, 400);
  });
});
```

Let's run the tests with Node.js built-in test runner:

```bash
npx tsx --test test/**/*.test.ts
```

Which should output something like:

```text
▶ CreateTodo
  ✔ should create a todo item (73.720135ms)
  ✔ should reject a todo item without a title (7.239035ms)
✔ CreateTodo (101.451992ms)
ℹ tests 2
ℹ suites 1
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 850.748924
```

  </TabItem>
  <TabItem value="bun">

```ts title="test/endpoints/CreateTodo.test.ts"
import { describe, it, before, after } from "bun:test";
import * as assert from "bun:assert";
import { setup, type TestContext } from "../setup.js";

describe("CreateTodo", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should create a todo item", async () => {
    const res = await ctx.client.fetch({
      method: "POST",
      path: "/api/todos",
      payload: {
        title: "test1",
      },
    });

    assert.equal(res.status, 201);
    assert.partialDeepStrictEqual(res.body, {
      title: "test1",
      completed: false,
    });
  });

  it("should reject a todo item without a title", async () => {
    const res = await ctx.client.fetch({
      method: "POST",
      path: "/api/todos",
      payload: {
        id: 123,
      },
    });

    assert.equal(res.status, 400);
  });
});
```

Let's run the tests with:

```bash
bun test
```

Which should output something like:

```text
bun test v1.3.13 (bf2e2cec)

test/endpoints/CreateTodo.test.ts:
✓ CreateTodo > should create a todo item [52.00ms]
✓ CreateTodo > should reject a todo item without a title [2.00ms]

 2 pass
 0 fail
Ran 2 tests across 1 file. [250.00ms]
```

  </TabItem>
</Tabs>

## Other endpoints

The other endpoints are quite similar.

### Read

```ts title="src/endpoints/ReadTodo.ts"
import { Endpoint, type HttpContext, INJECT } from "@tymber/core";
import { TodoRepository } from "../repositories/TodoRepository.js";
import { type JSONSchemaType } from "ajv";

interface PathParams {
  todoId: number;
}

export class ReadTodo extends Endpoint {
  static [INJECT] = [TodoRepository];

  constructor(private readonly todoRepository: TodoRepository) {
    super();
  }

  // the expected structure of the path parameters (using JSON Schema)
  pathParamsSchema: JSONSchemaType<PathParams> = {
    type: "object",
    properties: {
      todoId: { type: "number" },
    },
    required: ["todoId"],
  };

  async handle(ctx: HttpContext<never, PathParams>): Promise<Response> {
    const { todoId } = ctx.pathParams;
    const todo = await this.todoRepository.findById(ctx, todoId);

    if (!todo) {
      return Response.json({ message: "entity not found" }, { status: 404 });
    }

    return Response.json(todo);
  }
}
```

:::info

Path parameters are initially read from the URL as strings. Tymber validates them with Ajv coercion enabled, so a value like `/api/todos/42` is converted to the number `42` when the schema expects `type: "number"`.

:::

### Update

```ts title="src/endpoints/UpdateTodo.ts"
import {
  Endpoint,
  EntityNotFoundError,
  type HttpContext,
  INJECT,
} from "@tymber/core";
import { TodoRepository } from "../repositories/TodoRepository.js";
import { type JSONSchemaType } from "ajv";

interface PathParams {
  todoId: number;
}

interface Payload {
  title: string;
  completed: boolean;
}

export class UpdateTodo extends Endpoint {
  static [INJECT] = [TodoRepository];

  constructor(private readonly todoRepository: TodoRepository) {
    super();
  }

  pathParamsSchema: JSONSchemaType<PathParams> = {
    type: "object",
    properties: {
      todoId: { type: "number" },
    },
    required: ["todoId"],
  };

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1, maxLength: 100 },
      completed: { type: "boolean" },
    },
    required: ["title", "completed"],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload, PathParams>): Promise<Response> {
    const { todoId } = ctx.pathParams;

    try {
      await this.todoRepository.update(ctx, {
        id: todoId,
        ...ctx.payload,
      });

      return new Response(null, {
        status: 204,
      });
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        return Response.json({ message: "entity not found" }, { status: 404 });
      }
      throw e;
    }
  }
}
```

### Delete

```ts title="src/endpoints/DeleteTodo.ts"
import {
  Endpoint,
  type HttpContext,
  INJECT,
  EntityNotFoundError,
} from "@tymber/core";
import { TodoRepository } from "../repositories/TodoRepository.js";
import { type JSONSchemaType } from "ajv";

interface PathParams {
  todoId: number;
}

export class DeleteTodo extends Endpoint {
  static [INJECT] = [TodoRepository];

  constructor(private readonly todoRepository: TodoRepository) {
    super();
  }

  pathParamsSchema: JSONSchemaType<PathParams> = {
    type: "object",
    properties: {
      todoId: { type: "number" },
    },
    required: ["todoId"],
  };

  async handle(ctx: HttpContext<never, PathParams>): Promise<Response> {
    const { todoId } = ctx.pathParams;
    try {
      await this.todoRepository.deleteById(ctx, todoId);
      return new Response(null, { status: 204 });
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        return Response.json({ message: "entity not found" }, { status: 404 });
      }
      throw e;
    }
  }
}
```

## Ending note

That's it for the CRUD endpoints! You should now have the following module:

```ts title="src/module.ts"
import { type Module } from "@tymber/core";
import { join } from "node:path";
import { TodoRepository } from "./repositories/TodoRepository.js";
import { CreateTodo } from "./endpoints/CreateTodo.js";
import { ReadTodo } from "./endpoints/ReadTodo.js";
import { UpdateTodo } from "./endpoints/UpdateTodo.js";
import { DeleteTodo } from "./endpoints/DeleteTodo.js";

export const TodoModule: Module = {
  name: "my-todo-app",
  version: "0.0.1",
  assetsDir: join(import.meta.dirname, "..", "assets"),

  init(app) {
    app.component(TodoRepository);

    app.endpoint("POST", "/api/todos", CreateTodo);
    app.endpoint("GET", "/api/todos/:todoId", ReadTodo);
    app.endpoint("PUT", "/api/todos/:todoId", UpdateTodo);
    app.endpoint("DELETE", "/api/todos/:todoId", DeleteTodo);
  },
};
```

and the following directory structure, with similar tests added for the remaining endpoints:

```text
my-todo-app/
├── assets/
│   └── migrations/
│       └── 0001-init.sql
├── package.json
├── src/
│   ├── endpoints/
│   │   ├── CreateTodo.ts
│   │   ├── DeleteTodo.ts
│   │   ├── ReadTodo.ts
│   │   └── UpdateTodo.ts
│   ├── entrypoint.ts
│   ├── module.ts
│   └── repositories/
│       └── TodoRepository.ts
├── test/
│   ├── endpoints/
│   │   ├── CreateTodo.test.ts
│   │   ├── DeleteTodo.test.ts
│   │   ├── ReadTodo.test.ts
│   │   └── UpdateTodo.test.ts
│   └── setup.ts
└── tsconfig.json
```
