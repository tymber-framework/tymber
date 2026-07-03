import { AdminView, type HttpContext } from "@tymber/core";

export class ListMailsView extends AdminView {
  handle(ctx: HttpContext) {
    return ctx.render(["admin.layout", "admin.app-layout", "admin.mails"]);
  }
}
