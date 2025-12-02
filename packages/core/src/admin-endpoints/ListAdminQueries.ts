import { type JSONSchemaType } from "ajv";
import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/common";
import {
  AdminQueryRepository,
  type Query,
} from "../repositories/AdminQueryRepository.js";

export class ListAdminQueries extends AdminEndpoint {
  static [INJECT] = [AdminQueryRepository];

  constructor(private readonly adminQueryRepository: AdminQueryRepository) {
    super();
  }

  override querySchema: JSONSchemaType<Query> = {
    type: "object",
    properties: {
      q: { type: "string", maxLength: 100, nullable: true },
      size: { type: "integer", minimum: 1, maximum: 10000, default: 100 },
      sort: {
        type: "string",
        enum: ["id:desc", "id:asc", "created_at:asc", "created_at:desc"],
        default: "created_at:desc",
      },
    },
    required: [],
    additionalProperties: false,
  };

  override async handle(ctx: HttpContext<never, never, Query>) {
    const { query } = ctx;
    const items = await this.adminQueryRepository.find(ctx, query);
    return Response.json(items);
  }
}
