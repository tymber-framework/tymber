# `@tymber/mail`

The `@tymber/mail` module provides email queuing and sending capabilities for the Tymber framework. It includes a database-backed repository to track email status and an admin interface to view sent emails.

## Installation

```bash
npm install @tymber/mail
```

## Usage

### Registration

First, create a custom `MailProvider` implementation:

```ts title="src/services/MyMailProvider.ts"
import { ConfigService, INJECT, Result } from "@tymber/core";
import { type Mail, MailProvider } from "@tymber/mail";

interface Config {
  MAIL_PROVIDER_URL: string;
  MAIL_PROVIDER_API_KEY_SECRET: string;
}

export class MyMailProvider extends MailProvider {
  static [INJECT] = [ConfigService];

  private config: Config = {
    MAIL_PROVIDER_URL: "",
    MAIL_PROVIDER_API_KEY_SECRET: "",
  };

  constructor(configService: ConfigService) {
    super();
    configService.subscribe<Config>(
      {
        MAIL_PROVIDER_URL: {
          type: "string",
          format: "uri",
        },
        MAIL_PROVIDER_API_KEY_SECRET: {
          type: "string",
        },
      },
      (config) => {
        this.config = config;
      },
    );
  }

  async send(mail: Mail): Promise<Result<string>> {
    // logic to send the mail

    return { ok: true, value: "external-id" };
  }
}
```

Then, register the provider in your module:

```ts title="src/module.ts"
import { Module } from "@tymber/core";
import { MyMailProvider } from "./services/MyMailProvider.js";

export const MyModule: Module = {
  name: "my-module",
  version: "0.0.0",

  async init(app) {
    app.component(MyMailProvider);
  },
};
```

And finally, register the `MailModule` and your module in your application:

```ts title="src/entrypoint.ts"
import { App } from "@tymber/core";
import { MailModule } from "@tymber/mail";
import { MyModule } from "./module.js";

const app = await App.create({
  components: [
    // ...
  ],
  modules: [
    MailModule,
    MyModule
  ]
});
```

### Send an email

Inject the `MailService` to queue emails for sending:

```ts
import { Component, INJECT } from "@tymber/core";
import { MailService } from "@tymber/mail";

export class MyService extends Component {
  static [INJECT] = [MailService];

  constructor(private readonly mailService: MailService) {
    super();
  }

  async doSomething(ctx) {
    const res = await this.mailService.queue(ctx, {
      from: { email: "noreply@example.com", name: "My App" },
      to: [{ email: "user@example.com" }],
      subject: "Hello!",
      body: "This is a test email.",
    });

    if (!res.ok) {
      // validation error
    }
  }
}
```

Queued emails are sent asynchronously. A successful `queue()` result means the email was accepted and stored for sending, not necessarily that it has already been sent.

The mail payload must contain:

- `from`
- `subject`
- `body`
- at least one of `to`, `cc`, or `bcc`

Recipient fields must contain valid email addresses.

You can also provide:

- `replyTo`
- `attachments`

Attachments must include a `contentType`, a `filename`, and `content` as a `Uint8Array`.


:::tip

You can use the `MailService` in combination with:

- the `I18nService` to generate localized mail subjects
- the `TemplateEngine` to render email templates

:::
