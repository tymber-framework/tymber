import { AdminView, type HttpContext } from "@tymber/core";

export class LogInView extends AdminView {
  allowAnonymous = true;

  handle(ctx: HttpContext) {
    if (ctx.admin) {
      return ctx.redirect("/admin");
    }

    return ctx.render(["admin.layout", "admin.login"]);
  }
}
