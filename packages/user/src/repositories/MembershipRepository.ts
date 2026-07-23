import { type GroupId, type UserId, Repository } from "@tymber/core";

interface UserRoleId {
  userId: UserId;
  groupId: GroupId;
}

interface UserRole {
  userId: UserId;
  groupId: GroupId;
  role: number;
}

export class MembershipRepository extends Repository<UserRoleId, UserRole> {
  tableName = "t_memberships";
  idFields = ["userId", "groupId"];
}
