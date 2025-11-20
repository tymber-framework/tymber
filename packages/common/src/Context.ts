import { type Brand } from "./utils/types.js";

export type UserId = Brand<string, "UserId">;
export type OrgId = Brand<string, "OrgId">;
export type AdminUserId = Brand<number, "AdminUserId">;

export interface User {
  id: UserId;
  orgs: Array<{
    id: OrgId;
    role: string;
  }>;
}

export interface Admin {
  id: AdminUserId;
}

export interface Span {
  component: string;
  method: string;
  startedAt: number;
  duration: number;
  isSuccess: boolean;
}

export interface Context {
  startedAt: Date;

  tx?: any;

  user?: User;
  admin?: Admin;

  tracing: {
    enabled: boolean;
    spans: Array<Span>;
  };
}

export function emptyContext(): Context {
  return {
    startedAt: new Date(),
    tracing: {
      enabled: false,
      spans: [],
    },
  };
}
