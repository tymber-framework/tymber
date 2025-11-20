import { type ValidateFunction } from "ajv";
import { type HttpContext } from "./HttpContext.js";
import { Handler } from "./Handler.js";
import { AJV_INSTANCE } from "./utils/ajv.js";

export abstract class BaseView extends Handler {
  protected pathParamsSchema: unknown; // JSONSchemaType<Params>;
  protected querySchema: unknown; // JSONSchemaType<Query>;

  private validatePathParams?: ValidateFunction;
  private validateQuery?: ValidateFunction;

  override doHandle(ctx: HttpContext) {
    const { pathParams, query } = ctx;

    if (this.pathParamsSchema && !this.validatePathParams) {
      this.validatePathParams = AJV_INSTANCE.compile(this.pathParamsSchema);
    }

    if (this.validatePathParams) {
      this.validatePathParams(pathParams);
    }

    if (this.querySchema && !this.validateQuery) {
      this.validateQuery = AJV_INSTANCE.compile(this.querySchema);
    }

    if (this.validateQuery) {
      this.validateQuery(query);
    }

    return this.handle(ctx);
  }
}

export abstract class View extends BaseView {
  private _viewBrand!: void; // nominal typing

  override doHandle(ctx: HttpContext) {
    if (!this.allowAnonymous && !ctx.user) {
      return ctx.redirect("/login");
    }
    if (!this.hasPermission(ctx)) {
      return ctx.redirect("/forbidden");
    }
    return super.doHandle(ctx);
  }
}

export abstract class AdminView extends BaseView {
  private _adminViewBrand!: void; // nominal typing

  override doHandle(ctx: HttpContext) {
    if (!this.allowAnonymous && !ctx.admin) {
      return ctx.redirect("/admin/login");
    }
    // note: no hasPermission() check for admins
    return super.doHandle(ctx);
  }
}
