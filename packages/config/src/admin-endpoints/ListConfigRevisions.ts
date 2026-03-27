import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/core";
import type { JSONSchemaType } from "ajv";
import {
  ConfigRepository,
  type Query,
} from "../repositories/ConfigRepository.js";

export class ListConfigRevisions extends AdminEndpoint {
  static [INJECT] = [ConfigRepository];

  constructor(private readonly configRepository: ConfigRepository) {
    super();
  }

  override querySchema: JSONSchemaType<Query> = {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1, maximum: 100, default: 1 },
      size: { type: "integer", minimum: 1, maximum: 10000, default: 100 },
      sort: {
        type: "string",
        enum: ["created_at:asc", "created_at:desc"],
        default: "created_at:asc",
      },
    },
    required: [],
    additionalProperties: false,
  };

  override async handle(ctx: HttpContext) {
    const output = await this.configRepository.find(ctx, ctx.query, [
      "id",
      "createdAt",
      "createdBy",
      "comment",
    ]);

    return Response.json(output);
  }
}
