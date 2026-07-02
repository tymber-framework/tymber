import {
  type InternalGroupId,
  type InternalUserId,
  Repository,
} from "@tymber/core";

interface UserRoleId {
  userId: InternalUserId;
  groupId: InternalGroupId;
}

interface UserRole {
  userId: InternalUserId;
  groupId: InternalGroupId;
  role: number;
}

export class MembershipRepository extends Repository<UserRoleId, UserRole> {
  tableName = "t_memberships";
  idFields = ["userId", "groupId"];
}
