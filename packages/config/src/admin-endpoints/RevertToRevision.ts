import {
  AdminEndpoint,
  EntityNotFoundError,
  type HttpContext,
  INJECT,
} from "@tymber/core";
import {
  DBConfigService,
  ValidationError,
} from "../services/DBConfigService.js";
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
    additionalProperties: false,
  };

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      comment: { type: "string", maxLength: 1000 },
    },
    required: ["comment"],
  };

  async handle(ctx: HttpContext<never, PathParams>) {
    const { pathParams, payload } = ctx;

    try {
      const { id } = await this.configService.revertToRevision(
        ctx,
        pathParams.revisionId,
        payload,
      );

      return Response.json({ id });
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        return this.badRequest("invalid revision ID");
      } else if (e instanceof ValidationError) {
        return this.badRequest("invalid values");
      }
      {
        throw e;
      }
    }
  }
}
