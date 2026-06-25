# `@tymber/config`

The `@tymber/config` module provides a database-backed implementation of `ConfigService` with versioning and encryption.

## Installation

```bash
npm install @tymber/config
```

## Usage

Register the `ConfigModule` in your application:

```ts
import { App } from "@tymber/core";
import { ConfigModule } from "@tymber/config";

const app = await App.create({
  modules: [
    ConfigModule,
    // ...
  ],
});
```

## Features

- **Versioning**: Every configuration change creates a new revision. You can audit changes and revert to previous versions.
- **Encryption**: Values are encrypted at rest in the database.
- **Runtime Updates**: When configuration is updated (e.g., via an admin UI or API), Tymber automatically notifies all subscribers across all application instances.

## Configuration

The module requires the following environment variable for encryption:

- `CONFIG_SECRET_KEYS`: A comma-separated list of keys used to decrypt existing configurations. The first key in the list is used to encrypt new configurations.

```bash
CONFIG_SECRET_KEYS=my-super-secret-key
```

:::warning

If you lose your secret keys, you will not be able to decrypt your configuration values stored in the database.

:::
