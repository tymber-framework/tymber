import { AdminView, type HttpContext } from "@tymber/core";

export class ListAdminUsersView extends AdminView {
  override handle(ctx: HttpContext) {
    return ctx.render([
      "admin.layout",
      "admin.app-layout",
      "admin.admin-users",
    ]);
  }
}
