import { type HttpContext } from "../HttpContext.js";

export function isAdmin(ctx: HttpContext) {
  return ctx.admin !== undefined;
}
