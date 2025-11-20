import { type HttpContext } from "./HttpContext.js";
import { type ErrorObject, type ValidateFunction } from "ajv";
import { Handler } from "./Handler.js";
import { AJV_INSTANCE } from "./utils/ajv.js";

function formatErrors(
  errors: ErrorObject<string, Record<string, any>, unknown>[],
) {
  return errors.map((error) => ({
    keyword: error.keyword,
    message: error.message,
  }));
}

abstract class BaseEndpoint extends Handler {
  protected pathParamsSchema?: unknown; // JSONSchemaType<Params>;
  protected querySchema?: unknown; // JSONSchemaType<Query>;
  protected payloadSchema?: unknown; // JSONSchemaType<Payload>;

  private validatePathParams?: ValidateFunction;
  private validateQuery?: ValidateFunction;
  private validatePayload?: ValidateFunction;

  override doHandle(ctx: HttpContext): Response | Promise<Response> {
    const { pathParams, query, payload } = ctx;

    if (this.pathParamsSchema && !this.validatePathParams) {
      this.validatePathParams = AJV_INSTANCE.compile(this.pathParamsSchema);
    }

    if (this.validatePathParams && !this.validatePathParams(pathParams)) {
      return this.badRequest("invalid path params", {
        errors: formatErrors(this.validatePathParams.errors!),
      });
    }

    if (this.querySchema && !this.validateQuery) {
      this.validateQuery = AJV_INSTANCE.compile(this.querySchema);
    }

    if (this.validateQuery && !this.validateQuery(query)) {
      return this.badRequest("invalid query params", {
        errors: formatErrors(this.validateQuery.errors!),
      });
    }

    if (this.payloadSchema && !this.validatePayload) {
      this.validatePayload = AJV_INSTANCE.compile(this.payloadSchema);
    }

    if (this.validatePayload && !this.validatePayload(payload)) {
      return this.badRequest("invalid payload", {
        errors: formatErrors(this.validatePayload.errors!),
      });
    }

    if (!this.hasPermission(ctx)) {
      return Response.json(
        {
          message: "forbidden",
        },
        {
          status: 403,
        },
      );
    }

    return this.handle(ctx);
  }

  protected badRequest(message: string, details?: any) {
    return Response.json(
      {
        message,
        ...details,
      },
      {
        status: 400,
      },
    );
  }
}

export abstract class Endpoint extends BaseEndpoint {
  private _endpointBrand!: void; // nominal typing

  override doHandle(ctx: HttpContext) {
    if (!this.allowAnonymous && !ctx.user) {
      return Response.json(
        {
          message: "unauthorized",
        },
        {
          status: 401,
        },
      );
    }
    return super.doHandle(ctx);
  }
}

export abstract class AdminEndpoint extends BaseEndpoint {
  private _adminEndpointBrand!: void; // nominal typing

  override doHandle(ctx: HttpContext) {
    if (!this.allowAnonymous && !ctx.admin) {
      return Response.json(
        {
          message: "unauthorized",
        },
        {
          status: 401,
        },
      );
    }
    return super.doHandle(ctx);
  }
}
