import { createTestApp, BaseTestContext } from "@tymber/core";
import { LogModule } from "../src/index.js";
import { createTestDB as createSQLiteDB } from "@tymber/sqlite";
import { createTestDB as createPGDB } from "@tymber/postgres";
import { LogAdminClient } from "@tymber/client";
import { AdminModule, initTestDB } from "@tymber/admin";

export interface TestContext extends BaseTestContext {
  adminClient: LogAdminClient;
}

function createTestDB() {
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
      [AdminModule, LogModule],
    );

    const { adminSessionId } = await initTestDB(ctx.db);

    return {
      ...ctx,
      adminClient: new LogAdminClient(ctx.baseUrl, {
        cookie: `ssid=${adminSessionId}`,
      }),
    };
  } catch (e) {
    console.log(e);
  }
}
