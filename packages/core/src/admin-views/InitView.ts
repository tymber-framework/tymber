import { AdminView, type HttpContext, INJECT } from "@tymber/common";
import { MiscRepository } from "../repositories/MiscRepository.js";

export class InitView extends AdminView {
  static [INJECT] = [MiscRepository];

  allowAnonymous = true;

  constructor(private readonly miscRepository: MiscRepository) {
    super();
  }

  async handle(ctx: HttpContext) {
    const app = await this.miscRepository.findById(ctx, "app");

    if (app) {
      return ctx.redirect("/admin");
    }

    return ctx.render(["admin.layout", "admin.init"]);
  }
}
