import { Repository } from "@tymber/common";

interface Value {
  key: string;
  value: any;
}

export class MiscRepository extends Repository<string, Value> {
  tableName = "t_misc";
  idField = "key";
}
