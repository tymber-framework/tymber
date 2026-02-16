# Module

A `Module` is a collection of components and assets.

## Declaration

```ts
import { type AppInit, type Module } from "@tymber/common";
import { join } from "node:path";

export const MyModule: Module = {
    name: "my-module",
    version: "1.2.3",

    assetsDir: join(import.meta.dirname, "..", "assets"),

    adminSidebarItems: [],

    async init(app: AppInit) {
        // register components
    },
};

```

## File structure

Here's the suggested file structure for a Tymber module:

```text
my-module/
├── assets/
│   ├── i18n/               # Internationalization files (.json)
│   ├── migrations/         # Database migrations (.sql)
│   ├── static/             # Static files (images, css, etc.)
│   └── templates/          # View templates (.html)
├── src/
│   ├── admin-endpoints/    # Admin API endpoints
│   ├── admin-views/        # Admin views
│   ├── endpoints/          # API endpoints
│   ├── middlewares/        # Middleware functions
│   ├── repositories/       # Database access logic
│   ├── services/           # Business logic and components
│   ├── utils/              # Helper functions
│   └── views/              # Views
└── test/                   # Tests
```

See also:

- [Database migrations](../getting-started/database-migrations.md)
- [Internationalization](../getting-started/i18n.md)
- [Template engine](../utils/template-engine.md)
