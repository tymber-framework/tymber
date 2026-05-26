import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/core";
import { DBConfigService } from "../services/DBConfigService.js";
import { type JSONSchemaType } from "ajv";

interface PathParams {
  revisionId: number;
}

interface Payload {
  comment: string;
}

export class RevertToRevision extends AdminEndpoint {
  static [INJECT] = [DBConfigService];

  constructor(private readonly configService: DBConfigService) {
    super();
  }

  pathParamsSchema: JSONSchemaType<PathParams> = {
    type: "object",
    properties: {
      revisionId: { type: "number" },
    },
    required: ["revisionId"],
  };

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      comment: { type: "string", maxLength: 1000 },
    },
    required: ["comment"],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<never, PathParams>) {
    const { pathParams, payload } = ctx;

    const result = await this.configService.revertToRevision(
      ctx,
      pathParams.revisionId,
      payload,
    );

    if (!result.ok) {
      return this.badRequest(result.reason);
    }

    return Response.json({ id: result.value });
  }
}
