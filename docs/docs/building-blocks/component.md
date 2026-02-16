# Component

A `Component` is the main building block of your application.

In your application, everything is a `Component`:

- [`Endpoint`](./endpoint.md)
- [`View`](./view.md)
- [`Middleware`](./middleware.md)
- [`Repository`](./repository.md)

## Definition

```ts
import { Component, type Context } from "@tymber/common";

export class MyComponent extends Component {
    doSomething(ctx: Context) {
        // ...
    }
}
```

A component can also have dependencies:

```ts
import { Component, INJECT, type Context } from "@tymber/common";
import { MyOtherComponent } from "./MyOtherComponent";

export class MyComponent extends Component {
    static [INJECT] = [MyOtherComponent];

    constructor(private readonly myOtherComponent: MyOtherComponent) {
        super();
    }

    doSomething(ctx: Context) {
        return this.myOtherComponent.doSomeWork(ctx);
    }
}
```

See also: [Dependency Injection](../getting-started/dependency-injection.md)

## Registration

```ts
import { type Module, type AppInit } from "@tymber/common";
import { MyComponent } from "./MyComponent";

export const MyModule: Module = {
    name: "my-module",
    version: "1.2.3",

    init(app: AppInit) {
        app.component(MyComponent);
    },
};
```

:::info

Each component will be instantiated once during the application startup.

:::

## Context

`Context` is a special object that contains information about the current context:

- user information
- database transaction details
- tracing details

It must be **explicitly** passed as the first argument to all public methods of your component, to be passed throughout the chain:

```
Endpoint.handle(ctx)
└─┬ Service.doSomething(ctx, data)
  └─┬ Repository.findById(ctx, id)
    └── DB.query(ctx)
```

## Lifecycle

There are two lifecycle methods you can override:

- `init()`: executed on application startup
- `close()`: executed on application shutdown

```ts
import { Component, type Context } from "@tymber/common";

export class MyComponent extends Component {
    async init() {
        // ...
    }

    async close() {
        // ...
    }
}
```
