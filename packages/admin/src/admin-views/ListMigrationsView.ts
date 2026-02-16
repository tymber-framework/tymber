import { AdminView, type HttpContext } from "@tymber/common";

export class ListMigrationsView extends AdminView {
  handle(ctx: HttpContext) {
    return ctx.render(["admin.layout", "admin.app-layout", "admin.migrations"]);
  }
}
