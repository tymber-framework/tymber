import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/common";
import { type JSONSchemaType } from "ajv";
import {
  AdminUserRepository,
  type Query,
} from "../repositories/AdminUserRepository.js";

export class ListAdminUsers extends AdminEndpoint {
  static [INJECT] = [AdminUserRepository];

  constructor(private readonly adminUserRepository: AdminUserRepository) {
    super();
  }

  override querySchema: JSONSchemaType<Query> = {
    type: "object",
    properties: {
      q: { type: "string", maxLength: 100, nullable: true },
      size: { type: "integer", minimum: 1, maximum: 10000, default: 100 },
      sort: {
        type: "string",
        enum: ["id:asc", "id:desc", "username:asc", "username:desc"],
        default: "username:asc",
      },
    },
    required: [],
    additionalProperties: false,
  };

  override async handle(ctx: HttpContext<never, never, Query>) {
    const { query } = ctx;
    const users = await this.adminUserRepository.find(ctx, query, [
      "id",
      "createdAt",
      "createdBy",
      "updatedAt",
      "updatedBy",
      "username",
    ]);
    return Response.json(users);
  }
}
