# Dependency injection

Tymber comes with a built-in dependency injection system, heavily inspired from [`typed-inject`](https://www.npmjs.com/package/typed-inject).

:::info

Dependency Injection (DI) is a design pattern where instead of creating dependencies inside a class, they are passed
in (injected) from the outside. This makes code more modular, easier to test, and reduces coupling between components.

Reference: https://en.wikipedia.org/wiki/Dependency_injection

:::

## Usage

### Basic

Dependencies are declared using the `INJECT` static property:

```ts
import { Component, Context, INJECT } from "@tymber/core";
import { MyComponent } from "./MyComponent";

export class MyService extends Component {
    static [INJECT] = [MyComponent];

    constructor(private readonly myComponent: MyComponent) {
        super();
    }

    async doSomething(ctx: Context) {
        return this.myComponent.doSomeWork(ctx);
    }
}
```

When creating the [`App`](../building-blocks/app.md), the framework will:

- create the graph of dependencies
- create one instance of each component
- inject the dependencies into the components

If a dependency is missing, then `App.create()` will throw an error.

### Abstract dependency

You can also declare abstract dependencies.

Example:

```ts
import { Component, Context, INJECT } from "@tymber/core";

export abstract class MailProvider extends Component {
    abstract send(ctx: Context, mail: any): Promise<void>;
}

export class MyMailService extends Component {
    static [INJECT] = [MailProvider];

    constructor(private readonly mailProvider: MailProvider) {
        super();
    }

    async sendWelcomeMail(ctx: Context) {
        const mail = { /* ... */ };
        return this.mailProvider.send(ctx, mail);
    }
}
```

The actual implementation is provided when creating the [`App`](../building-blocks/app.md):

```ts
const mailProvider = new (class extends MailProvider {
    send(ctx: Context, mail: any): Promise<void> {
        // ...
    }
})();

const app = await App.create({
    components: [mailProvider],
    modules: [
        // ...
    ],
});
```

## Testing

Dependency injection makes it easy to unit-test the behavior of a component.

Example with the abstract `MailProvider` above:

```ts
import { describe, it } from "node:test";
import * as assert from "node:assert";
import { Context, emptyContext } from "@tymber/core";

describe("MyMailService", () => {
    it("should send a mail", async () => {
        let lastMail: any = undefined;

        const mailProvider = new (class extends MailProvider {
            send(ctx: Context, mail: any) {
                lastMail = mail;
                return Promise.resolve();
            }
        })();

        const mailService = new MyMailService(mailProvider);

        await mailService.sendWelcomeMail(emptyContext());

        assert.deepEqual(lastMail, {
            // ...
        });
    });

    it("should send a mail, and retry once", async () => {
        let isFirst = true;
        let lastMail: any = undefined;

        const mailProvider = new (class extends MailProvider {
            send(ctx: Context, mail: any) {
                if (isFirst) {
                    isFirst = false;
                    return Promise.reject(new Error("network error"));
                }
                lastMail = mail;
                return Promise.resolve();
            }
        })();

        const mailService = new MyMailService(mailProvider);

        await mailService.sendWelcomeMail(emptyContext());

        assert.deepEqual(lastMail, {
            // ...
        });
    });

    it("should give up sending a mail after 1 retry", async () => {
        let callCount = 0;

        const mailProvider = new (class extends MailProvider {
            send(ctx: Context, mail: any) {
                callCount++;
                return Promise.reject(new Error("network error"));
            }
        })();

        const mailService = new MyMailService(mailProvider);

        await mailService.sendWelcomeMail(emptyContext());

        assert.equal(callCount, 2);
    });
});
```