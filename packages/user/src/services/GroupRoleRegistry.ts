import { Component, type GroupRole } from "@tymber/core";

export class GroupRoleRegistry extends Component {
  private readonly roles = new Set<GroupRole>();

  public add(role: GroupRole) {
    if (this.roles.has(role)) {
      throw new Error(`Group role ${role} already exists`);
    }
    this.roles.add(role);
  }

  public has(role: GroupRole): boolean {
    return this.roles.has(role);
  }

  public all(): GroupRole[] {
    return Array.from(this.roles);
  }
}
