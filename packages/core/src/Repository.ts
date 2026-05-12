import { camelToSnakeCase } from "./utils/camelToSnakeCase.js";
import { snakeToCamelCase } from "./utils/snakeToCamelCase.js";
import { Component, INJECT } from "./Component.js";
import { DB } from "./DB.js";
import type { Context } from "./Context.js";
import { sql, Statement } from "./utils/sql.js";

class RepositoryError extends Error {}

export class EntityNotFoundError extends RepositoryError {}

export abstract class Repository<
  ID,
  T extends Record<string, any>,
> extends Component {
  static [INJECT] = [DB];

  protected abstract tableName: string;
  protected idFields: string[] = ["id"];
  protected dateFields: string[] = [];
  protected jsonFields: string[] = [];

  constructor(protected readonly db: DB) {
    super();
  }

  public findById(ctx: Context, id: ID) {
    const query = sql.select().from(this.tableName).where(this.idClause(id));

    return this.one(ctx, query);
  }

  async deleteById(ctx: Context, id: ID) {
    const query = sql.deleteFrom(this.tableName).where(this.idClause(id));

    const res = await this.db.run(ctx, query);

    if (res.affectedRows !== 1) {
      throw new EntityNotFoundError();
    }
  }

  private idClause(id: ID) {
    if (this.idFields.length === 1) {
      return {
        [camelToSnakeCase(this.idFields[0])]: id,
      };
    } else {
      return this.idFields.reduce((acc, k) => {
        // @ts-expect-error
        acc[camelToSnakeCase(k)] = id[k];
        return acc;
      }, {});
    }
  }

  async insert(ctx: Context, entity: Partial<T>) {
    this.onBeforeInsert(ctx, entity);

    const rows = await this.db.query(
      ctx,
      sql
        .insert()
        .into(this.tableName)
        .values([this.toRow(entity)])
        .returning(this.idFields.map((idField) => camelToSnakeCase(idField))),
    );

    if (rows.length !== 1) {
      throw new RepositoryError("unexpected number of inserted rows");
    }

    Object.assign(entity, this.toEntity(rows[0]));

    return entity as T;
  }

  async update(ctx: Context, entity: Partial<T>) {
    const isIDSpecified = this.idFields.every(
      (idField) => entity[idField] !== undefined,
    );

    if (!isIDSpecified) {
      throw new RepositoryError("id is required");
    }

    this.onBeforeUpdate(ctx, entity);

    const idClause: Record<string, any> = {};
    const entityWithoutId = Object.assign({}, entity);

    for (const idField of this.idFields) {
      idClause[camelToSnakeCase(idField)] = entity[idField];
      delete entityWithoutId[idField];
    }

    const { affectedRows } = await this.db.run(
      ctx,
      sql
        .update(this.tableName)
        .set(this.toRow(entityWithoutId))
        .where(idClause),
    );

    if (affectedRows === 0) {
      throw new EntityNotFoundError();
    } else if (affectedRows > 1) {
      throw new RepositoryError("unexpected number of updated rows");
    } else {
      return entity as T;
    }
  }

  public startTransaction<R>(ctx: Context, fn: () => Promise<R>) {
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
      const column = camelToSnakeCase(key);

      if (this.db.name === "sqlite" && this.jsonFields.includes(key)) {
        row[column] = JSON.stringify(entity[key]);
      } else {
        row[column] = entity[key];
      }
    });

    return row;
  }

  protected toEntity(row: Record<string, any>) {
    const entity: Record<string, any> = {};

    Object.keys(row).forEach((key) => {
      const fieldName = snakeToCamelCase(key);
      let fieldValue = row[key];

      if (this.db.name === "sqlite") {
        if (
          this.dateFields.includes(fieldName) &&
          typeof fieldValue === "number"
        ) {
          fieldValue = new Date(fieldValue);
        } else if (
          this.jsonFields.includes(fieldName) &&
          typeof fieldValue === "string"
        ) {
          fieldValue = JSON.parse(fieldValue);
        }
      }

      entity[fieldName] = fieldValue;
    });

    return entity as T;
  }

  protected onBeforeInsert(ctx: Context, entity: Partial<T>) {}
  protected onBeforeUpdate(ctx: Context, entity: Partial<T>) {}
}

export interface Page<T> {
  items: T[];
}
