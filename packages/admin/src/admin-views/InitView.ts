import { type HttpContext, INJECT, View } from "@tymber/core";
import { MiscRepository } from "../repositories/MiscRepository.js";

export class InitView extends View {
  static [INJECT] = [MiscRepository];

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
