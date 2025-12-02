import { AdminView, type HttpContext } from "@tymber/common";

export class InitPasswordView extends AdminView {
  async handle(ctx: HttpContext) {
    return ctx.render([
      "admin.layout",
      "admin.app-layout",
      "admin.init-password",
    ]);
  }
}
