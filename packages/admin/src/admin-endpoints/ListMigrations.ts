import { type JSONSchemaType } from "ajv";
import {
  MigrationRepository,
  type Query,
} from "../repositories/MigrationRepository.js";
import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/common";

export class ListMigrations extends AdminEndpoint {
  static [INJECT] = [MigrationRepository];

  constructor(private readonly migrationRepository: MigrationRepository) {
    super();
  }

  override querySchema: JSONSchemaType<Query> = {
    type: "object",
    properties: {
      q: { type: "string", maxLength: 100, nullable: true },
      size: { type: "integer", minimum: 1, maximum: 10000, default: 100 },
      sort: {
        type: "string",
        enum: ["run_at:asc", "run_at:desc"],
        default: "run_at:desc",
      },
    },
    required: [],
    additionalProperties: false,
  };

  override async handle(ctx: HttpContext<never, never, Query>) {
    const { query } = ctx;
    const items = await this.migrationRepository.find(ctx, query);
    return Response.json(items);
  }
}
