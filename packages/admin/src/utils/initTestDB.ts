import {
  type AdminUserId,
  type Context,
  type DB,
  emptyContext,
  randomUUID,
  sql,
} from "@tymber/common";

async function createAdminUser(ctx: Context, db: DB) {
  const rows = await db.query(
    ctx,
    sql.select().from("t_admin_users").where({ username: "admin" }),
  );

  if (rows.length === 1) {
    return rows[0].id as AdminUserId;
  }

  const insertRows = await db.query(
    ctx,
    sql
      .insert()
      .into("t_admin_users")
      .values([
        {
          username: "admin",
        },
      ])
      .returning(["id"]),
  );

  return insertRows[0].id as AdminUserId;
}

async function createSession(ctx: Context, db: DB, adminUserId: AdminUserId) {
  const adminSessionId = randomUUID();

  await db.run(
    ctx,
    sql
      .insert()
      .into("t_admin_sessions")
      .values([
        {
          id: adminSessionId,
          user_id: adminUserId,
        },
      ]),
  );

  return adminSessionId;
}

function initApp(ctx: Context, db: DB) {
  return db.run(
    ctx,
    sql
      .insert()
      .into("t_misc")
      .values([
        {
          key: "app",
          value: "{}",
        },
      ]),
  );
}

export async function initTestDB(db: DB) {
  const ctx = emptyContext();
  const adminUserId = await createAdminUser(ctx, db);
  const adminSessionId = await createSession(ctx, db, adminUserId);
  await initApp(ctx, db);

  return { adminUserId, adminSessionId };
}
