import { createTestApp, BaseTestContext, AdminUserId } from "@tymber/core";
import { ConfigModule } from "../src";
import { ConfigAdminClient } from "@tymber/client";
import { AdminModule, initTestDB } from "@tymber/admin";
import { createTestDB as createSQLiteDB } from "@tymber/sqlite";
import { createTestDB as createPGDB } from "@tymber/postgres";

export interface TestContext extends BaseTestContext {
  adminSessionId: string;
  adminUserId: AdminUserId;
  adminClient: ConfigAdminClient;
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
  process.env.CONFIG_SECRET_KEYS = "test";

  const ctx = await createTestApp(
    () => createTestDB(),
    [AdminModule, ConfigModule],
  );

  const { adminSessionId, adminUserId } = await initTestDB(ctx.db);

  return {
    ...ctx,
    adminSessionId,
    adminUserId,
    adminClient: new ConfigAdminClient(ctx.baseUrl, {
      cookie: `ssid=${adminSessionId}`,
    }),
  };
}
