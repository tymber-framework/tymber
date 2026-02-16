# Endpoint

An `Endpoint` is a special [`Component`](./component.md) that handles HTTP requests and returns a `Response` object.

They come in two flavors:

- `Endpoint` for user-facing endpoints
- `AdminEndpoint` for admin-only endpoints

## Definition

```ts
import { Endpoint, type HttpContext } from "@tymber/common";

export class MyEndpoint extends Endpoint {
    async handle(ctx: HttpContext) {
        return Response.json({
            hello: "world",
        });
    }
}
```

## Registration

```ts
import { type Module, type AppInit } from "@tymber/common";
import { MyEndpoint } from "./endpoints/MyEndpoint";

export const MyModule: Module = {
    name: "my-module",
    version: "1.2.3",

    init(app: AppInit) {
        app.endpoint("GET", "/hello", MyEndpoint);

        // with path parameters
        app.endpoint("GET", "/orders/:orderId/items/:itemId", ReadOrderItem);

        // admin endpoint
        app.adminEndpoint("GET", "/hello", MyAdminEndpoint);
    },
};
```

## HTTP context

The `HttpContext` object is a special [`Context`](./component.md#context) object that contains information about the current HTTP request:

```ts
export interface HttpContext<Payload = any, PathParams = any, QueryParams = any>
    extends Context {
    method: HttpMethod;
    payload: Payload;
    path: string;
    pathParams: PathParams;
    query: QueryParams;
    headers: Headers;
    cookies: Record<string, string>;
    abortSignal: AbortSignal;

    locale: Locale;
    responseHeaders: Headers;
    sessionId?: string;
    adminSessionId?: string;

    render: (
        view: string | string[],
        data?: Record<string, any>,
    ) => Promise<Response>;

    redirect(path: string, type?: HttpRedirectCode): Response;
}
```

## Validation

Tymber validates HTTP requests before they reach your `handle()` method with [AJV](https://ajv.js.org/).

If validation fails, it returns a `HTTP 400 Bad Request` response with error details.

### Request body

To validate the request body, define a `payloadSchema` property using [JSON Schema](https://json-schema.org/):

```ts
import { Endpoint, type HttpContext } from "@tymber/common";
import type { JSONSchemaType } from "ajv";

interface Payload {
  title: string;
  description?: string;
  dueDate?: string;
};

export class CreateTodo extends Endpoint {
  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1 },
      description: { type: "string", nullable: true },
      dueDate: { type: "string", format: "date-time", nullable: true },
    },
    required: ["title"],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<CreateTodoPayload>) {
    // at this point, ctx.payload is guaranteed to match the Payload interface
    const { payload } = ctx;

    // persist the entity
    
    return new Response(null, { status: 201 });
  }
}
```

### Path parameters

To validate the path parameters (e.g., `/todos/:todoId`), define a `pathParamsSchema` property:

```ts
import { Endpoint, type HttpContext } from "@tymber/common";
import { type JSONSchemaType } from "ajv";

interface PathParams {
    todoId: string;
}

export class ReadTodo extends Endpoint {
    pathParamsSchema: JSONSchemaType<PathParams> = {
        type: "object",
        properties: {
            todoId: { type: "string", minLength: 1 },
        },
        required: ["todoId"],
        additionalProperties: false,
    };

    async handle(ctx: HttpContext<never, PathParams>) {
        // at this point, ctx.pathParams is guaranteed to match the PathParams interface
        const { pathParams } = ctx;
        const { todoId } = pathParams;

        // fetch the entity

        return Response.json(item);
    }
}
```

### Query parameters

To validate the path parameters (e.g., `/todos?completed=true`), define a `querySchema` property:

```ts
import { Endpoint, type HttpContext } from "@tymber/common";
import { type JSONSchemaType } from "ajv";

interface Query {
    completed: boolean;
}

export class ListTodos extends Endpoint {
    querySchema: JSONSchemaType<Query> = {
        type: "object",
        properties: {
            completed: { type: "boolean", nullable: true, default: false },
        },
        required: [],
        additionalProperties: false,
    };

    async handle(ctx: HttpContext<never, never, Query>) {
        // at this point, ctx.query is guaranteed to match the Query interface
        const { query } = ctx;

        // fetch the entities

        return Response.json(items);
    }
}
```

## Authentication and anonymous access

By default, an anonymous request will return a `HTTP 401 Unauthorized` response.

You can allow anonymous access by setting `allowAnonymous = true` in your endpoint:

```ts
import { Endpoint, type HttpContext } from "@tymber/common";

export class MyEndpoint extends Endpoint {
    allowAnonymous = true;

    async handle(ctx: HttpContext) {
        return Response.json({
            hello: "world",
        });
    }
}

```

## Authorization

Authorization checks happen in the `hasPermission(ctx)` method.

An unauthorized request will return a `HTTP 403 Forbidden` response.

```ts
import { Endpoint, GroupId, type HttpContext } from "@tymber/common";

enum Role {
    MANAGER = 0,
    READER = 1,
}

interface PathParams {
    groupId: GroupId;
}

export class ListGroupItems extends Endpoint {
    pathParamsSchema: JSONSchemaType<PathParams> = {
        type: "object",
        properties: {
            groupId: { type: "string", minLength: 1 },
        },
        required: ["groupId"],
        additionalProperties: false,
    }

    hasPermission(ctx: HttpContext) {
        const { groupId } = ctx.pathParams;
        return ctx.user.groups.some(
            (group) => group.id === groupId && group.role === Role.MANAGER,
        );
    }

    async handle(ctx: HttpContext<never, PathParams>) {
        // at this point, user is guaranteed to have the MANAGER role for the given group
        const { pathParams } = ctx;
        const { groupId } = pathParams;

        // ...

        return Response.json(items);
    }
}
```
