import { createTestApp, BaseTestContext, Result } from "@tymber/core";
import { createTestDB as createSQLiteDB } from "@tymber/sqlite";
import { createTestDB as createPGDB } from "@tymber/postgres";
import { MailAdminClient } from "@tymber/client";
import { MailModule, Mail, MailProvider } from "../src";
import { AdminModule, initTestDB } from "@tymber/admin";

export interface TestContext extends BaseTestContext {
  adminClient: MailAdminClient;
}

export function createTestDB() {
  if (process.env.USE_SQLITE) {
    return createSQLiteDB();
  } else {
    // use PostgreSQL by default
    return createPGDB();
  }
}

export async function setup(): Promise<TestContext> {
  try {
    const ctx = await createTestApp(
      () => createTestDB(),
      [
        AdminModule,
        MailModule,
        {
          name: "test",
          version: "0.0.1",
          init(app) {
            app.component(
              class extends MailProvider {
                async send(mail: Mail): Promise<Result<string>> {
                  return {
                    ok: true,
                    value: "abc123",
                  };
                }
              },
            );
          },
        },
      ],
    );

    const { adminSessionId } = await initTestDB(ctx.db);

    return {
      ...ctx,
      adminClient: new MailAdminClient(ctx.baseUrl, {
        cookie: `ssid=${adminSessionId}`,
      }),
    };
  } catch (e) {
    console.log(e);
  }
}
