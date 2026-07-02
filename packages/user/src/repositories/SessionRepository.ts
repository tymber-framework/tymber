import {
  type Brand,
  type Context,
  type InternalUserId,
  Repository,
  sql,
} from "@tymber/core";

export type SessionId = Brand<string, "SessionId">;

interface Session {
  id: SessionId;
  userId: InternalUserId;
  expiresAt: Date;
}

export class SessionRepository extends Repository<SessionId, Session> {
  tableName = "t_user_sessions";

  deleteExpiredSessions(ctx: Context) {
    return this.db.query(
      ctx,
      sql.deleteFrom(this.tableName).where(sql.lt("expires_at", new Date())),
    );
  }
}
