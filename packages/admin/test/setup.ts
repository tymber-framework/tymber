import { createTestDB as createPGDB } from "@tymber/postgres";
import { createTestDB as createSQLiteDB } from "@tymber/sqlite";
import { AdminClient } from "@tymber/client";
import {
  AdminUserId,
  BaseTestContext,
  createTestApp,
  Endpoint,
  HttpContext,
} from "@tymber/core";
import { AdminModule, initTestDB } from "../src";

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
    const ctx = await createTestApp(
      () => createTestDB(),
      [
        AdminModule,
        {
          name: "test",
          version: "0.0.0",
          init(app) {
            app.endpoint(
              "GET",
              "/test",
              class extends Endpoint {
                async handle() {
                  return Response.json({ hello: "world" });
                }
              },
            );
            app.endpoint(
              "POST",
              "/test",
              class extends Endpoint {
                async handle(ctx: HttpContext<any>) {
                  return Response.json(ctx.payload);
                }
              },
            );
            app.endpoint(
              "POST",
              "/throwing",
              class extends Endpoint {
                async handle() {
                  return Promise.reject(new Error("test error"));
                }
              },
            );
          },
        },
      ],
    );

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
