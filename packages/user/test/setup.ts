import {
  createTestApp,
  BaseTestContext,
  sql,
  emptyContext,
  AdminUserId,
} from "@tymber/core";
import { GroupRoleRegistry, UserModule, UserRoleRegistry } from "../src";
import { randomUUID } from "node:crypto";
import { UserAdminClient, UserClient } from "@tymber/client";
import { createTestDB as createSQLiteDB } from "@tymber/sqlite";
import { createTestDB as createPGDB } from "@tymber/postgres";
import { AdminModule, initTestDB } from "@tymber/admin";
import { join } from "node:path";

export interface TestContext extends BaseTestContext {
  adminSessionId: string;
  adminUserId: AdminUserId;
  userIds: string[];
  externalUserIds: string[];
  groupIds: string[];
  externalGroupIds: string[];
  sessionIds: string[];
  clients: UserClient[];
  adminClient: UserAdminClient;
  userRoleRegistry: UserRoleRegistry;
  groupRoleRegistry: GroupRoleRegistry;
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
      [
        AdminModule,
        UserModule,
        {
          name: "test",
          version: "0.0.0",
          // load translations for roles
          assetsDir: join(import.meta.dirname, "assets"),
          init(app) {},
        },
      ],
    );

    const { adminSessionId, adminUserId } = await initTestDB(ctx.db);

    const externalUserIds = [randomUUID(), randomUUID(), randomUUID()];

    const result = await ctx.db.query(
      emptyContext(),
      sql
        .insert()
        .into("t_users")
        .values([
          {
            external_id: externalUserIds[0],
            first_name: "Alice",
            last_name: "Smith",
            email: "alice@smith.com",
            role: 1,
          },
          {
            external_id: externalUserIds[1],
            first_name: "bob",
            last_name: "johnson",
            email: "bob@johnson.com",
            role: 2,
          },
          {
            external_id: externalUserIds[2],
            first_name: "CAROL",
            last_name: "DOE",
            email: "carol.doe@example.com",
            role: 3,
          },
        ])
        .returning(["id"]),
    );

    const userIds = result.map((row) => row.id);

    const externalGroupIds = [randomUUID(), randomUUID()];

    const groupResult = await ctx.db.query(
      emptyContext(),
      sql
        .insert()
        .into("t_groups")
        .values([
          {
            external_id: externalGroupIds[0],
            label: "AAA",
          },
          {
            external_id: externalGroupIds[1],
            label: "bbb",
          },
        ])
        .returning(["id"]),
    );

    const groupIds = groupResult.map((row) => row.id);

    await ctx.db.query(
      emptyContext(),
      sql
        .insert()
        .into("t_memberships")
        .values([
          {
            user_id: userIds[0],
            group_id: groupIds[0],
            role: 0,
          },
          {
            user_id: userIds[1],
            group_id: groupIds[0],
            role: 1,
          },
          {
            user_id: userIds[1],
            group_id: groupIds[1],
            role: 2,
          },
          {
            user_id: userIds[2],
            group_id: groupIds[1],
            role: 3,
          },
        ]),
    );

    const sessionIds = [randomUUID(), randomUUID(), randomUUID()];

    await ctx.db.query(
      emptyContext(),
      sql
        .insert()
        .into("t_user_sessions")
        .values([
          {
            id: sessionIds[0],
            user_id: userIds[0],
            expires_at: new Date(Date.now() + 1_000),
          },
          {
            id: sessionIds[1],
            user_id: userIds[1],
            expires_at: new Date(Date.now() + 1_000),
          },
          {
            id: sessionIds[2],
            user_id: userIds[2],
            expires_at: new Date(Date.now() + 1_000),
          },
        ]),
    );

    return {
      ...ctx,
      adminSessionId,
      adminUserId,
      externalUserIds,
      userIds,
      externalGroupIds,
      groupIds,
      sessionIds,
      clients: [
        new UserClient(ctx.baseUrl, {
          cookie: `sid=${sessionIds[0]}`,
        }),
        new UserClient(ctx.baseUrl, {
          cookie: `sid=${sessionIds[1]}`,
        }),
        new UserClient(ctx.baseUrl, {
          cookie: `sid=${sessionIds[2]}`,
        }),
      ],
      adminClient: new UserAdminClient(ctx.baseUrl, {
        cookie: `ssid=${adminSessionId}`,
      }),
      userRoleRegistry: ctx.getInstance(UserRoleRegistry)!,
      groupRoleRegistry: ctx.getInstance(GroupRoleRegistry)!,
    };
  } catch (e) {
    throw e;
  }
}

export async function insertTestUser(ctx: TestContext) {
  const result = await ctx.db.query(
    emptyContext(),
    sql
      .insert()
      .into("t_users")
      .values([
        {
          external_id: randomUUID(),
        },
      ])
      .returning(["id"]),
  );

  const userId = result[0].id;

  return {
    userId,
  };
}
