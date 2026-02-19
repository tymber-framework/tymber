import { Component } from "./Component.js";
import type { AdminUserId, Context } from "./Context.js";
import type { Page } from "./Repository.js";
import type { HttpContext } from "./HttpContext.js";

interface Query {
  createdBefore?: Date;
  createdAfter?: Date;
  action?: string;
  createdBy?: AdminUserId;
  size: number;
  sort: "created_at:asc" | "created_at:desc";
}

export interface AdminAuditLog {
  id: number;
  createdAt: Date;
  createdBy: {
    id: AdminUserId;
    username: string;
  };
  action: string;
  description: string;
}

export abstract class AdminAuditService extends Component {
  abstract defineCustomDescription(
    action: string,
    customDescription: (
      ctx: HttpContext,
      log: { id: number; details: Record<string, any> },
    ) => Promise<string>,
  ): void;
  abstract find(ctx: Context, query: Query): Promise<Page<AdminAuditLog>>;
  abstract log(
    ctx: Context,
    action: string,
    details?: Record<string, any>,
  ): Promise<void>;
}

export class NoopAdminAuditService extends AdminAuditService {
  defineCustomDescription(
    action: string,
    customDescription: (
      ctx: HttpContext,
      log: {
        id: number;
        details: Record<string, any>;
      },
    ) => Promise<string>,
  ): void {}

  find(ctx: Context, query: Query): Promise<Page<AdminAuditLog>> {
    return Promise.resolve({ items: [] });
  }

  log(
    ctx: Context,
    action: string,
    details: Record<string, any>,
  ): Promise<void> {
    return Promise.resolve();
  }
}
