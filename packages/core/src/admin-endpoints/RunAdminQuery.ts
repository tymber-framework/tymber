import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/common";
import { AdminQueryRepository } from "../repositories/AdminQueryRepository.js";
import type { JSONSchemaType } from "ajv";

interface Payload {
  query: string;
  comment: string;
}

export class RunAdminQuery extends AdminEndpoint {
  static [INJECT] = [AdminQueryRepository];

  constructor(private readonly adminQueryRepository: AdminQueryRepository) {
    super();
  }

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      query: { type: "string", maxLength: 1000 },
      comment: { type: "string", maxLength: 1000 },
    },
    required: ["query", "comment"],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload>) {
    const { payload } = ctx;

    try {
      const affectedRows = await this.adminQueryRepository.runQuery(
        ctx,
        payload.query,
        payload.comment,
      );

      return Response.json({ affectedRows });
    } catch (_e) {
      return this.badRequest("invalid query");
    }
  }
}
