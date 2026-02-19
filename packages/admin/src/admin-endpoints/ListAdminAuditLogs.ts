import { type JSONSchemaType } from "ajv";
import {
  AdminAuditService,
  AdminEndpoint,
  type HttpContext,
  INJECT,
} from "@tymber/core";
import { type Query } from "../repositories/AdminAuditRepository.js";

export class ListAdminAuditLogs extends AdminEndpoint {
  static [INJECT] = [AdminAuditService];

  constructor(private readonly adminAuditService: AdminAuditService) {
    super();
  }

  override querySchema: JSONSchemaType<Query> = {
    type: "object",
    properties: {
      action: { type: "string", maxLength: 100, nullable: true },
      createdBy: { type: "integer", nullable: true },
      size: { type: "integer", minimum: 1, maximum: 10000, default: 100 },
      sort: {
        type: "string",
        enum: ["created_at:asc", "created_at:desc"],
        default: "created_at:desc",
      },
    },
    required: [],
    additionalProperties: false,
  };

  override async handle(ctx: HttpContext<never, never, Query>) {
    const { query } = ctx;

    const output = await this.adminAuditService.find(ctx, query);

    return Response.json(output);
  }
}
