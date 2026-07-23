import { type HttpContext, INJECT, AdminEndpoint } from "@tymber/core";
import { type JSONSchemaType } from "ajv";
import {
  type UserQuery,
  UserRepository,
} from "../repositories/UserRepository.js";
import { toGroupId } from "../utils/toGroupId.js";

interface PathParams {
  groupId: string;
}

export class ListUsersInGroup extends AdminEndpoint {
  static [INJECT] = [UserRepository];

  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  pathParamsSchema: JSONSchemaType<PathParams> = {
    type: "object",
    properties: {
      groupId: { type: "string", pattern: "^[0-9]+$" },
    },
    required: ["groupId"],
  };

  querySchema: JSONSchemaType<Omit<UserQuery, "groupId">> = {
    type: "object",
    properties: {
      q: { type: "string", maxLength: 100, nullable: true },
      page: { type: "integer", minimum: 1, maximum: 100, default: 1 },
      size: { type: "integer", minimum: 1, maximum: 10000, default: 100 },
      sort: {
        type: "string",
        enum: [
          "first_name:asc",
          "first_name:desc",
          "last_name:asc",
          "last_name:desc",
          "email:asc",
          "email:desc",
        ],
        default: "last_name:asc",
      },
    },
    required: [],
  };

  override async handle(ctx: HttpContext<never, PathParams, UserQuery>) {
    const { pathParams, query } = ctx;
    const { groupId } = pathParams;

    const output = await this.userRepository.find(
      ctx,
      {
        ...query,
        groupId: toGroupId(groupId),
      },
      ["id", "externalId", "firstName", "lastName", "email"],
    );

    return Response.json(output);
  }
}
