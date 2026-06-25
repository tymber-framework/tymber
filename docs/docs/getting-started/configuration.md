---
toc_max_heading_level: 4
---

# Configuration

Tymber provides a centralized and reactive configuration management system. It allows components to declare their own configuration schema and react to configuration changes at runtime.

## Usage

Components can subscribe to configuration by declaring a schema and a handler. This is typically done in the component's constructor.

Tymber uses [JSON Schema](https://json-schema.org/) for configuration validation.

```ts
import { Component, INJECT, ConfigService } from "@tymber/core";

interface Config {
  MY_SERVICE_API_URL: string;
  MY_SERVICE_API_KEY: string;
}

export class MyService extends Component {
  static [INJECT] = [ConfigService];

  private config: Config = {
    MY_SERVICE_API_URL: "",
    MY_SERVICE_API_KEY: "",
  };

  constructor(configService: ConfigService) {
    super();

    configService.subscribe<Config>(
      {
        MY_SERVICE_API_URL: {
          type: "string",
          format: "uri",
        },
        MY_SERVICE_API_KEY: {
          type: "string",
        },
      },
      (config) => {
        this.config = config;
      },
    );
  }

  async doSomething() {
    // use this.config
  }
}
```

When the application starts, `ConfigService` will:

1. Collect all subscribed schemas.
2. Fetch current values from the active configuration source.
3. Validate values against the combined schema.
4. Notify all subscribers with their specific configuration.

## Configuration sources

### Environment variables

By default, Tymber reads configuration from environment variables.

You can use it with the `dotenv` package (or [Node.js built-in .env support](https://nodejs.org/docs/latest/api/environment_variables.html#dotenv)) to load environment variables from a `.env` file.

### Database

For more advanced needs, the [@tymber/config](../built-in-modules/config.md) module provides a database-backed implementation with versioning and encryption.
