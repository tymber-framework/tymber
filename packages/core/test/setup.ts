import { createTestDB as createPGDB } from "@tymber/postgres";
import { createTestDB as createSQLiteDB } from "@tymber/sqlite";
import { AdminClient } from "@tymber/client";
import { AdminUserId, BaseTestContext, createTestApp } from "@tymber/common";
import { CoreModule, initTestDB } from "../src";

export function createTestDB() {
  if (process.env.USE_SQLITE) {
    return createSQLiteDB();
  } else {
    // use PostgreSQL by default
    return createPGDB();
  }
}

export interface TestContext extends BaseTestContext {
  adminUserId: AdminUserId;
  adminClient: AdminClient;
}

export async function setup() {
  try {
    const ctx = await createTestApp(() => createTestDB(), [CoreModule]);

    const { adminSessionId, adminUserId } = await initTestDB(ctx.db);

    return {
      ...ctx,
      adminUserId,
      adminClient: new AdminClient(ctx.baseUrl, {
        cookie: `ssid=${adminSessionId}`,
      }),
    };
  } catch (e) {
    throw e;
  }
}
