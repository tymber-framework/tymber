import { camelToSnakeCase } from "./utils/camelToSnakeCase.js";
import { snakeToCamelCase } from "./utils/snakeToCamelCase.js";
import { Component, INJECT } from "./Component.js";
import { DB } from "./DB.js";
import type { AdminUserId, Context, UserId } from "./Context.js";
import { sql, Statement } from "./utils/sql.js";

export abstract class Repository<
  ID,
  T extends Record<string, any>,
> extends Component {
  static [INJECT] = [DB];

  protected abstract tableName: string;
  protected idField: string | string[] = "id";
  protected dateFields: string[] = [];

  constructor(protected readonly db: DB) {
    super();
  }

  public findById(ctx: Context, id: ID) {
    const query = sql.select().from(this.tableName).where(this.idClause(id));

    return this.one(ctx, query);
  }

  private idClause(id: ID) {
    if (Array.isArray(this.idField)) {
      return this.idField.reduce((acc, k) => {
        // @ts-expect-error
        acc[camelToSnakeCase(k)] = id[k];
        return acc;
      }, {});
    } else {
      return {
        [camelToSnakeCase(this.idField)]: id,
      };
    }
  }

  public async save(ctx: Context, entity: Partial<T>) {
    const idFields = Array.isArray(this.idField)
      ? this.idField
      : [this.idField];
    const isIDSpecified = idFields.every(
      (idField) => entity[idField] !== undefined,
    );

    if (isIDSpecified) {
      const idClause: Record<string, any> = {};
      idFields.forEach((idField) => {
        idClause[camelToSnakeCase(idField)] = entity[idField];
      });

      this.onBeforeUpdate(ctx, entity);

      const { affectedRows } = await this.db.run(
        ctx,
        sql.update(this.tableName).set(this.toRow(entity)).where(idClause),
      );

      if (affectedRows > 1) {
        throw "unexpected number of updated rows";
      } else if (affectedRows === 1) {
        return entity as T;
      }
    }

    this.onBeforeInsert(ctx, entity);

    const rows = await this.db.query(
      ctx,
      sql
        .insert()
        .into(this.tableName)
        .values([this.toRow(entity)])
        .returning(idFields.map((idField) => camelToSnakeCase(idField))),
    );

    if (rows.length !== 1) {
      throw "unexpected number of inserted rows";
    }

    Object.assign(entity, this.toEntity(rows[0]));

    return entity as T;
  }

  public startTransaction(ctx: Context, fn: () => Promise<void>) {
    return this.db.startTransaction(ctx, fn);
  }

  protected async one(ctx: Context, query: Statement) {
    const rows = await this.db.query(ctx, query);

    return rows.length === 1 ? this.toEntity(rows[0]) : undefined;
  }

  protected async all(ctx: Context, query: Statement) {
    const rows = await this.db.query(ctx, query);

    return rows.map((row) => this.toEntity(row));
  }

  protected async count(ctx: Context, countQuery: Statement) {
    const rows = await this.db.query(ctx, countQuery);
    return parseInt(rows[0].count, 10);
  }

  protected toRow(entity: Partial<T>) {
    const row: Record<string, any> = {};

    Object.keys(entity).forEach((key) => {
      row[camelToSnakeCase(key)] = entity[key];
    });

    return row;
  }

  protected toEntity(row: Record<string, any>) {
    const entity: Record<string, any> = {};

    Object.keys(row).forEach((key) => {
      const fieldName = snakeToCamelCase(key);
      let fieldValue = row[key];

      if (
        this.dateFields.includes(fieldName) &&
        typeof fieldValue === "number"
      ) {
        fieldValue = new Date(fieldValue);
      }
      entity[fieldName] = fieldValue;
    });

    return entity as T;
  }

  protected onBeforeInsert(ctx: Context, entity: Partial<T>) {}
  protected onBeforeUpdate(ctx: Context, entity: Partial<T>) {}
}

export interface AuditedEntity {
  createdBy?: UserId;
  createdAt?: Date;
  updatedBy?: UserId;
  updatedAt?: Date;
}

export abstract class AuditedRepository<
  ID,
  T extends AuditedEntity,
> extends Repository<ID, T> {
  protected override dateFields = ["createdAt", "updatedAt"];

  protected override onBeforeInsert(ctx: Context, entity: Partial<T>) {
    entity.createdAt = ctx.startedAt;
    entity.updatedAt = ctx.startedAt;
    if (ctx.user) {
      entity.createdBy = ctx.user.id;
      entity.updatedBy = ctx.user.id;
    }
  }

  protected override onBeforeUpdate(ctx: Context, entity: Partial<T>) {
    entity.updatedAt = ctx.startedAt;
    if (ctx.user) {
      entity.updatedBy = ctx.user.id;
    }
  }
}

export interface AdminAuditedEntity {
  createdBy?: AdminUserId;
  createdAt?: Date;
  updatedBy?: AdminUserId;
  updatedAt?: Date;
}

export abstract class AdminAuditedRepository<
  ID,
  T extends AdminAuditedEntity,
> extends Repository<ID, T> {
  protected override dateFields = ["createdAt", "updatedAt"];

  protected override onBeforeInsert(ctx: Context, entity: Partial<T>) {
    entity.createdAt = ctx.startedAt;
    if (ctx.admin) {
      entity.createdBy = ctx.admin.id;
    }
  }

  protected override onBeforeUpdate(ctx: Context, entity: Partial<T>) {
    entity.updatedAt = ctx.startedAt;
    if (ctx.admin) {
      entity.updatedBy = ctx.admin.id;
    }
  }
}

export interface Page<T> {
  items: T[];
}
