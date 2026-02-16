import { AdminView, type HttpContext } from "@tymber/core";

export class ListMigrationsView extends AdminView {
  handle(ctx: HttpContext) {
    return ctx.render(["admin.layout", "admin.app-layout", "admin.migrations"]);
  }
}
