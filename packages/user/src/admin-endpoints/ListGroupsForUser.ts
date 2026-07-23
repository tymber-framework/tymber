import { type HttpContext, INJECT, AdminEndpoint } from "@tymber/core";
import { type JSONSchemaType } from "ajv";
import {
  GroupRepository,
  type Query,
} from "../repositories/GroupRepository.js";
import { toUserId } from "../utils/toUserId.js";

interface PathParams {
  userId: string;
}

export class ListGroupsForUser extends AdminEndpoint {
  static [INJECT] = [GroupRepository];

  constructor(private readonly groupRepository: GroupRepository) {
    super();
  }

  pathParamsSchema: JSONSchemaType<PathParams> = {
    type: "object",
    properties: {
      userId: { type: "string", pattern: "^[0-9]+$" },
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
  };

  override async handle(ctx: HttpContext<never, PathParams, Query>) {
    const { pathParams, query } = ctx;
    const { userId } = pathParams;

    const output = await this.groupRepository.find(
      ctx,
      {
        ...query,
        userId: toUserId(userId),
      },
      ["id", "externalId", "label"],
    );

    return Response.json(output);
  }
}
