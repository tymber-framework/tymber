import {
  AdminView,
  ConfigService,
  type HttpContext,
  INJECT,
} from "@tymber/core";

export class ConfigView extends AdminView {
  static [INJECT] = [ConfigService];

  constructor(private readonly configService: ConfigService) {
    super();
  }

  override async handle(ctx: HttpContext) {
    const config = await this.configService.getCurrentConfig(ctx);

    config.sort((a, b) => a.key.localeCompare(b.key));

    return ctx.render(["admin.layout", "admin.app-layout", "admin.config"], {
      config,
    });
  }
}
