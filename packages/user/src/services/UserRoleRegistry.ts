import { Component, type UserRole } from "@tymber/core";

const DEFAULT_USER_ROLE = 0 as UserRole;

export class UserRoleRegistry extends Component {
  private readonly roles = new Set<UserRole>([DEFAULT_USER_ROLE]);

  public add(role: UserRole) {
    if (this.roles.has(role)) {
      throw new Error(`User role ${role} already exists`);
    }
    this.roles.add(role);
  }

  public has(role: UserRole): boolean {
    return this.roles.has(role);
  }

  public all(): UserRole[] {
    return Array.from(this.roles);
  }
}
