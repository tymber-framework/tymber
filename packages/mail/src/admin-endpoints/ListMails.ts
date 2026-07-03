import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/core";
import { MailRepository } from "../repositories/MailRepository.js";
import { type JSONSchemaType } from "ajv";

interface Query {
  q?: string;
  status?: number;
  page: number;
  size: number;
  sort: "created_at:asc" | "created_at:desc";
}

export class ListMails extends AdminEndpoint {
  static [INJECT] = [MailRepository];

  constructor(private readonly mailRepository: MailRepository) {
    super();
  }

  querySchema: JSONSchemaType<Query> = {
    type: "object",
    properties: {
      q: { type: "string", maxLength: 100, nullable: true },
      status: { type: "integer", enum: [0, 1, 2, 3], nullable: true },
      page: { type: "integer", minimum: 1, maximum: 100, default: 1 },
      size: { type: "integer", minimum: 1, maximum: 500, default: 50 },
      sort: {
        type: "string",
        enum: ["created_at:asc", "created_at:desc"],
        default: "created_at:asc",
      },
    },
    required: [],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<never, never, Query>) {
    const { query } = ctx;
    const output = await this.mailRepository.find(ctx, query);
    return Response.json(output);
  }
}
