import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/core";
import { DBConfigService } from "../services/DBConfigService.js";
import type { JSONSchemaType } from "ajv";

interface Payload {
  values: Record<string, any>;
  comment: string;
}

export class CreateConfigRevision extends AdminEndpoint {
  static [INJECT] = [DBConfigService];

  constructor(private readonly configService: DBConfigService) {
    super();
  }

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      values: { type: "object" },
      comment: { type: "string", maxLength: 1000 },
    },
    required: ["values", "comment"],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload>) {
    const { payload } = ctx;

    const result = await this.configService.createNewRevision(ctx, payload);

    if (!result.ok) {
      return this.badRequest(result.reason);
    }

    return Response.json({ id: result.value });
  }
}
