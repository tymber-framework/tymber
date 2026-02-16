import {
  AdminView,
  type HttpContext,
  INJECT,
  ModuleDefinitions,
} from "@tymber/common";

export class HomeView extends AdminView {
  static [INJECT] = [ModuleDefinitions];

  constructor(private readonly modules: ModuleDefinitions) {
    super();
  }

  async handle(ctx: HttpContext) {
    // @ts-expect-error untyped
    if (ctx.admin.isTemporaryPassword) {
      return ctx.redirect("/admin/init_password");
    }

    return ctx.render(["admin.layout", "admin.app-layout", "admin.home"], {
      modules: this.modules.modules,
    });
  }
}
