import { View, type HttpContext } from "@tymber/core";

export class LogInView extends View {
  handle(ctx: HttpContext) {
    if (ctx.admin) {
      return ctx.redirect("/admin");
    }

    return ctx.render(["admin.layout", "admin.login"]);
  }
}
