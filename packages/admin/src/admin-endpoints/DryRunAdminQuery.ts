import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/common";
import { AdminQueryRepository } from "../repositories/AdminQueryRepository.js";
import type { JSONSchemaType } from "ajv";

interface Payload {
  query: string;
}

export class DryRunAdminQuery extends AdminEndpoint {
  static [INJECT] = [AdminQueryRepository];

  constructor(private readonly adminQueryRepository: AdminQueryRepository) {
    super();
  }

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      query: { type: "string", maxLength: 1000 },
    },
    required: ["query"],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload>) {
    const { payload } = ctx;

    try {
      const affectedRows = await this.adminQueryRepository.dryRunQuery(
        ctx,
        payload.query,
      );

      return Response.json({ affectedRows });
    } catch (e) {
      return this.badRequest("invalid query");
    }
  }
}
