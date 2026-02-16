# Middleware

A `Middleware` is a special [`Component`](./component.md) that can interrupt the request processing and return a response.

## Definition

- modifying response headers: 

```ts
import { HttpContext, Middleware } from "@tymber/common";

export class MyMiddleware extends Middleware {
    async handle(ctx: HttpContext) {
        ctx.responseHeaders.set("some-header", "1");
    }
}
```

- redirecting:

```ts
import { HttpContext, Middleware } from "@tymber/common";

export class MyMiddleware extends Middleware {
    async handle(ctx: HttpContext) {
        return ctx.redirect("/login");
    }
}
```

- aborting the request:

```ts
import { HttpContext, Middleware } from "@tymber/common";

export class MyMiddleware extends Middleware {
    async handle(ctx: HttpContext) {
        return new Response(null, { status: 403 });
    }
}
```

## Registration

```ts
import { type Module, type AppInit } from "@tymber/common";
import { MyMiddleware } from "./middlewares/MyMiddleware";

export const MyModule: Module = {
    name: "my-module",
    version: "1.2.3",

    init(app: AppInit) {
        app.middleware(MyMiddleware);
    },
};
```
