import { createTestDB as createPGDB } from "@tymber/postgres";
import { createTestDB as createSQLiteDB } from "@tymber/sqlite";
import {
  BaseTestContext,
  createTestApp,
  emptyContext,
  GroupId,
  sql,
  UserId,
} from "@tymber/core";
import { UserModule } from "@tymber/user";
import { SSEModule, SSEService } from "../src";
import { randomUUID } from "node:crypto";

export function createTestDB() {
  if (process.env.USE_SQLITE) {
    return createSQLiteDB();
  } else {
    // use PostgreSQL by default
    return createPGDB();
  }
}

export interface TestContext extends BaseTestContext {
  userIds: UserId[];
  groupIds: GroupId[];
  sessionIds: string[];
  sseService: SSEService;
}

export async function setup(): Promise<TestContext> {
  try {
    const ctx = await createTestApp(
      () => createTestDB(),
      [UserModule, SSEModule],
    );

    const users = await initUsers(ctx);

    return {
      ...ctx,
      ...users,
      sseService: ctx.getInstance(SSEService),
    };
  } catch (e) {
    throw e;
  }
}

async function initUsers(ctx: BaseTestContext) {
  const result = await ctx.db.query(
    emptyContext(),
    sql
      .insert()
      .into("t_users")
      .values([
        {
          first_name: "Alice",
          last_name: "Smith",
          email: "alice@smith.com",
        },
        {
          first_name: "bob",
          last_name: "johnson",
          email: "bob@johnson.com",
        },
        {
          first_name: "CAROL",
          last_name: "DOE",
          email: "carol.doe@example.com",
        },
      ])
      .returning(["id"]),
  );

  const userIds = result.map((row) => row.id);

  const groupResult = await ctx.db.query(
    emptyContext(),
    sql
      .insert()
      .into("t_groups")
      .values([
        {
          label: "AAA",
        },
        {
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
    userIds,
    groupIds,
    sessionIds,
  };
}
