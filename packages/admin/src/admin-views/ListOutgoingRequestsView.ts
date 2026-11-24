import { AdminView, type HttpContext } from "@tymber/core";

export class ListOutgoingRequestsView extends AdminView {
  override handle(ctx: HttpContext) {
    return ctx.render([
      "admin.layout",
      "admin.app-layout",
      "admin.outgoing-requests",
    ]);
  }
}
