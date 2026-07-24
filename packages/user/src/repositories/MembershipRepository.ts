import {
  type GroupId,
  type UserId,
  Repository,
  type GroupRole,
} from "@tymber/core";

export interface MembershipId {
  userId: UserId;
  groupId: GroupId;
}

export interface Membership {
  userId: UserId;
  groupId: GroupId;
  role: GroupRole;
}

export class MembershipRepository extends Repository<MembershipId, Membership> {
  tableName = "t_memberships";
  idFields = ["userId", "groupId"];
}
