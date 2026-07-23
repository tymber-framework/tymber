import { type Brand } from "./utils/types.js";

export type UserId = Brand<bigint, "UserId">;
export type ExternalUserId = Brand<string, "ExternalUserId">;
export type UserRole = Brand<number, "UserRole">;
export type GroupId = Brand<bigint, "GroupId">;
export type ExternalGroupId = Brand<string, "ExternalGroupId">;
export type GroupRole = Brand<number, "GroupRole">;
export type AdminUserId = Brand<number, "AdminUserId">;

export interface ConnectedUser {
  id: UserId;
  externalId: ExternalUserId;

  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;

  groups: Array<{
    id: GroupId;
    externalId: ExternalGroupId;
    label: string;
    role: GroupRole;
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
