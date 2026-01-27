import { type Brand } from "./utils/types.js";

export type InternalUserId = Brand<bigint, "InternalUserId">;
export type UserId = Brand<string, "UserId">;
export type InternalGroupId = Brand<bigint, "InternalGroupId">;
export type GroupId = Brand<string, "GroupId">;
export type Role = Brand<number, "Role">;
export type AdminUserId = Brand<number, "AdminUserId">;

export interface ConnectedUser {
  internalId: InternalUserId;
  id: UserId;

  firstName: string;
  lastName: string;
  email: string;

  groups: Array<{
    internalId: InternalGroupId;
    id: GroupId;
    label: string;
    role: Role;
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

  user?: ConnectedUser;
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
