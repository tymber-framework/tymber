import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/core";
import {
  DBConfigService,
  ValidationError,
} from "../services/DBConfigService.js";
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
    required: ["values"],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload>) {
    const { payload } = ctx;

    try {
      const { id } = await this.configService.createNewRevision(ctx, payload);

      return Response.json({ id });
    } catch (e) {
      if (e instanceof ValidationError) {
        return this.badRequest("invalid values");
      } else {
        throw e;
      }
    }
  }
}
