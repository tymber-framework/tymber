import {
  createTestApp,
  BaseTestContext,
  sql,
  emptyContext,
} from "@tymber/common";
import { UserModule } from "../src";
import { randomUUID } from "node:crypto";
import { UserAdminClient, UserClient } from "@tymber/client";
import { createTestDB as createSQLiteDB } from "@tymber/sqlite";
import { createTestDB as createPGDB } from "@tymber/postgres";
import { CoreModule, initTestDB } from "@tymber/core";

export interface TestContext extends BaseTestContext {
  adminSessionId: string;
  internalUserIds: string[];
  userIds: string[];
  internalGroupIds: string[];
  groupIds: string[];
  sessionIds: string[];
  clients: UserClient[];
  adminClient: UserAdminClient;
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
      [CoreModule, UserModule],
    );

    const { adminSessionId } = await initTestDB(ctx.db);

    const userIds = [randomUUID(), randomUUID(), randomUUID()];

    const result = await ctx.db.query(
      emptyContext(),
      sql
        .insert()
        .into("t_users")
        .values([
          {
            id: userIds[0],
            first_name: "Alice",
            last_name: "Smith",
            email: "alice@smith.com",
          },
          {
            id: userIds[1],
            first_name: "bob",
            last_name: "johnson",
            email: "bob@johnson.com",
          },
          {
            id: userIds[2],
            first_name: "CAROL",
            last_name: "DOE",
            email: "carol.doe@example.com",
          },
        ])
        .returning(["internal_id"]),
    );

    const internalUserIds = result.map((row) => row.internal_id);

    const groupIds = [randomUUID(), randomUUID()];

    const groupResult = await ctx.db.query(
      emptyContext(),
      sql
        .insert()
        .into("t_groups")
        .values([
          {
            id: groupIds[0],
            label: "AAA",
          },
          {
            id: groupIds[1],
            label: "bbb",
          },
        ])
        .returning(["internal_id"]),
    );

    const internalGroupIds = groupResult.map((row) => row.internal_id);

    await ctx.db.query(
      emptyContext(),
      sql
        .insert()
        .into("t_user_roles")
        .values([
          {
            user_id: internalUserIds[0],
            group_id: internalGroupIds[0],
            role: 0,
          },
          {
            user_id: internalUserIds[1],
            group_id: internalGroupIds[0],
            role: 1,
          },
          {
            user_id: internalUserIds[1],
            group_id: internalGroupIds[1],
            role: 2,
          },
          {
            user_id: internalUserIds[2],
            group_id: internalGroupIds[1],
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
            user_id: internalUserIds[0],
          },
          {
            id: sessionIds[1],
            user_id: internalUserIds[1],
          },
          {
            id: sessionIds[2],
            user_id: internalUserIds[2],
          },
        ]),
    );

    return {
      ...ctx,
      adminSessionId,
      userIds,
      internalUserIds,
      groupIds,
      internalGroupIds,
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
    };
  } catch (e) {
    throw e;
  }
}

export async function insertTestUser(ctx: TestContext) {
  const userId = randomUUID();

  const result = await ctx.db.query(
    emptyContext(),
    sql
      .insert()
      .into("t_users")
      .values([
        {
          id: userId,
        },
      ])
      .returning(["internal_id"]),
  );

  const internalUserId = result[0].internal_id;

  return {
    userId,
    internalUserId,
  };
}
