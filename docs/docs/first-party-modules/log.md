# `@tymber/log`

The `@tymber/log` module provides database-backed logging capabilities for the Tymber framework. It includes a `LogService` implementation that stores logs in your database and provides an admin interface to view and filter logs.

## Installation

```bash
npm install @tymber/log
```

## Registration

```ts title="src/entrypoint.ts"
import { App } from "@tymber/core";
import { LogModule } from "@tymber/log";

const app = await App.create({
  modules: [
    LogModule,
  ],
});
```

## Usage

Inject the `LogService` and use it to log messages:

```ts
import { Component, INJECT, LogService } from "@tymber/core";

export class MyComponent extends Component {
  static [INJECT] = [LogService];

  constructor(private readonly log: LogService) {
    super();
  }

  async doSomething() {
    this.log.debug("Debug message");
    this.log.info("Information message");
    this.log.warn("Warning message");
    this.log.error("Error message");

    // Log with formatted message
    this.log.info("User %s created with id %d", "john@example.com", 123);
  }
}
```

Or with a scoped logger, for better context:

```ts
import { Component, INJECT, LogService } from "@tymber/core";

export class MyComponent extends Component {
  static [INJECT] = [LogService];
  
  private readonly log: LogService;

  constructor(log: LogService) {
    super();
    this.log = log.for("MyComponent");
  }

  async doSomething() {
    // ...
  }
}
```

## Configuration

| Option                  | Type                                     | Default  | Description                                             |
|-------------------------|------------------------------------------|----------|---------------------------------------------------------|
| `LOG_LEVEL`             | `"debug" \| "info" \| "warn" \| "error"` | `"warn"` | Minimum log level to store in the database              |
| `LOG_RETENTION_IN_DAYS` | `number`                                 | `30`     | Number of days to retain logs before automatic deletion |
| `LOG_WRITE_BATCH_SIZE`  | `number`                                 | `100`    | Number of logs to batch before flushing to the database |
