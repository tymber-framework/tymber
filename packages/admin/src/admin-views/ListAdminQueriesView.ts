import { AdminView, type HttpContext } from "@tymber/core";

export class ListAdminQueriesView extends AdminView {
  override handle(ctx: HttpContext) {
    return ctx.render([
      "admin.layout",
      "admin.app-layout",
      "admin.admin-queries",
    ]);
  }
}
