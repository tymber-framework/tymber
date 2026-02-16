# View

An `View` is a special [`Component`](./component.md) that handles HTTP requests and returns a view.

They come in two flavors:

- `View` for user-facing views
- `AdminView` for admin-only views

## Definition

```ts
import { View, type HttpContext } from "@tymber/core";

export class MyView extends View {
    async handle(ctx: HttpContext) {
        return ctx.render(["layout", "my-view"], {
            hello: "world",
        });
    }
}
```

## Registration

```ts
import { type Module, type AppInit } from "@tymber/core";
import { MyView } from "./views/MyView";

export const MyModule: Module = {
    name: "my-module",
    version: "1.2.3",

    init(app: AppInit) {
        app.view("/hello", MyView);

        // with path parameters
        app.view("/orders/:orderId/items/:itemId", OrderItemView);

        // admin view
        app.adminView("/admin/hello", MyAdminView);
    },
};
```
