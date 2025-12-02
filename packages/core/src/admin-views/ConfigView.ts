import {
  AdminView,
  ConfigService,
  type HttpContext,
  INJECT,
} from "@tymber/common";

function obfuscate(str: string) {
  if (str.length < 10) {
    return "***";
  }
  const start = str.slice(0, 2);
  const end = str.slice(-2);
  return `${start}***${end}`;
}

export class ConfigView extends AdminView {
  static [INJECT] = [ConfigService];

  constructor(private readonly configService: ConfigService) {
    super();
  }

  override async handle(ctx: HttpContext) {
    const config = await this.configService.getCurrentConfig(ctx);

    config.sort((a, b) => a.key.localeCompare(b.key));

    for (const elem of config) {
      if (elem.shouldObfuscate) {
        elem.value = obfuscate(elem.value);
      }
    }

    return ctx.render(["admin.layout", "admin.app-layout", "admin.config"], {
      config,
    });
  }
}
