import { type HttpContext, INJECT, AdminEndpoint } from "@tymber/core";
import { type JSONSchemaType } from "ajv";
import {
  type Query,
  GroupRepository,
} from "../repositories/GroupRepository.js";

export class ListGroups extends AdminEndpoint {
  static [INJECT] = [GroupRepository];

  constructor(private readonly groupRepository: GroupRepository) {
    super();
  }

  querySchema: JSONSchemaType<Omit<Query, "userId">> = {
    type: "object",
    properties: {
      q: { type: "string", maxLength: 100, nullable: true },
      page: { type: "integer", minimum: 1, maximum: 100, default: 1 },
      size: { type: "integer", minimum: 1, maximum: 10000, default: 100 },
      sort: {
        type: "string",
        enum: ["label:asc", "label:desc"],
        default: "label:asc",
      },
    },
    required: [],
    additionalProperties: false,
  };

  override async handle(ctx: HttpContext<never, never, Query>) {
    const { query } = ctx;

    const output = await this.groupRepository.find(ctx, query, ["id", "label"]);

    return Response.json(output);
  }
}
