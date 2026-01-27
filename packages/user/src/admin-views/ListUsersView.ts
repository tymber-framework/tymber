import { AdminView, type HttpContext } from "@tymber/common";

export class ListUsersView extends AdminView {
  async handle(ctx: HttpContext) {
    return ctx.render(["admin.layout", "admin.app-layout", "admin.users"]);
  }
}
