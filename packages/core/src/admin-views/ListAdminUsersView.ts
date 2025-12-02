import { AdminView, type HttpContext } from "@tymber/common";

export class ListAdminUsersView extends AdminView {
  override handle(ctx: HttpContext) {
    return ctx.render([
      "admin.layout",
      "admin.app-layout",
      "admin.admin-users",
    ]);
  }
}
