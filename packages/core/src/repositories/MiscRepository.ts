import {
  type AdminAuditedEntity,
  AdminAuditedRepository,
} from "@tymber/common";

interface Value extends AdminAuditedEntity {
  key: string;
  value: any;
}

export class MiscRepository extends AdminAuditedRepository<string, Value> {
  tableName = "t_misc";
  idField = "key";
}
