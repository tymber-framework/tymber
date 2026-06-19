import { createTestDB as createPGDB } from "@tymber/postgres";
import { createTestDB as createSQLiteDB } from "@tymber/sqlite";
import {
  BaseTestContext,
  Component,
  createTestApp,
  emptyContext,
  GroupId,
  INJECT,
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
    let sseService: SSEService | undefined;

    const ctx = await createTestApp(
      () => createTestDB(),
      [
        UserModule,
        SSEModule,
        {
          name: "test",
          version: "0.0.0",
          init(app) {
            app.component(
              class extends Component {
                static [INJECT] = [SSEService];

                constructor(_sseService: SSEService) {
                  super();
                  sseService = _sseService;
                }
              },
            );
          },
        },
      ],
    );

    const users = await initUsers(ctx);

    return {
      ...ctx,
      ...users,
      sseService,
    };
  } catch (e) {
    throw e;
  }
}

async function initUsers(ctx: BaseTestContext) {
  const userIds = [
    randomUUID() as UserId,
    randomUUID() as UserId,
    randomUUID() as UserId,
  ];

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

  const groupIds = [randomUUID() as GroupId, randomUUID() as GroupId];

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
    userIds,
    groupIds,
    sessionIds,
  };
}
