import {
  type HttpContext,
  INJECT,
  AdminEndpoint,
  type GroupId,
} from "@tymber/common";
import { type JSONSchemaType } from "ajv";
import {
  type UserQuery,
  UserRepository,
} from "../repositories/UserRepository.js";

interface PathParams {
  groupId: GroupId;
}

export class ListUsersInGroup extends AdminEndpoint {
  static [INJECT] = [UserRepository];

  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  pathParamsSchema: JSONSchemaType<PathParams> = {
    type: "object",
    properties: {
      groupId: { type: "string", format: "uuid" },
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
    additionalProperties: false,
  };

  override async handle(ctx: HttpContext<never, PathParams, UserQuery>) {
    const { pathParams, query } = ctx;

    query.groupId = pathParams.groupId;

    const output = await this.userRepository.find(ctx, query, [
      "id",
      "firstName",
      "lastName",
      "email",
    ]);

    return Response.json(output);
  }
}
