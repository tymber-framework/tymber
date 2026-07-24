# `@tymber/openapi`

The `@tymber/openapi` module provides automatic OpenAPI specification generation and an interactive API console for your Tymber application.

## Installation

```bash
npm install @tymber/openapi
```

## Usage

Register the `OpenAPIModule` in your application:

```ts
import { App } from "@tymber/core";
import { OpenAPIModule } from "@tymber/openapi";

const app = await App.create({
  modules: [
    OpenAPIModule,
    // ...
  ],
});
```

Once registered, the API console will be available at the `/console` path of your application.

## Features

- **Automatic Specification Generation**: The module automatically builds an OpenAPI 3.1.0 specification by inspecting the endpoints of all registered modules.
- **Interactive API Console**: A built-in view that renders the OpenAPI specification, allowing you to explore and test your API directly from the browser.
- **Schema Integration**: It automatically extracts path parameters, query parameters, and payload schemas from your endpoint handlers to document the request and response structures.

### Customizing Operations

You can provide additional OpenAPI metadata directly in your endpoint handlers by adding an `openapi` property to your `Endpoint` class:

```ts
import { Endpoint, type HttpContext } from "@tymber/core";

export class GetMyEndpoint extends Endpoint {
  public openapi = {
    summary: "My custom summary",
    description: "A more detailed description of what this endpoint does.",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  };

  handle(ctx: HttpContext) {
    return Response.json({ message: "Hello World" });
  }
}
```

The module will merge these properties into the generated OpenAPI operation object.
