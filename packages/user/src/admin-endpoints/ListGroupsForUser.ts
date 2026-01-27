import {
  type HttpContext,
  INJECT,
  AdminEndpoint,
  type UserId,
} from "@tymber/common";
import { type JSONSchemaType } from "ajv";
import {
  GroupRepository,
  type Query,
} from "../repositories/GroupRepository.js";

interface PathParams {
  userId: UserId;
}

export class ListGroupsForUser extends AdminEndpoint {
  static [INJECT] = [GroupRepository];

  constructor(private readonly groupRepository: GroupRepository) {
    super();
  }

  pathParamsSchema: JSONSchemaType<PathParams> = {
    type: "object",
    properties: {
      userId: { type: "string", format: "uuid" },
    },
    required: ["userId"],
  };

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

  override async handle(ctx: HttpContext<never, PathParams, Query>) {
    const { pathParams, query } = ctx;

    query.userId = pathParams.userId;

    const output = await this.groupRepository.find(ctx, query, ["id", "label"]);

    return Response.json(output);
  }
}
