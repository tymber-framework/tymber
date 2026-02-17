import { Component, INJECT } from "./Component.js";
import { BaseTemplateEngine, TemplateEngine } from "./TemplateEngine.js";
import { I18nService } from "./I18nService.js";
import { pick } from "./contrib/accept-language-parser.js";
import { ModuleDefinitions } from "./Module.js";
import type { HttpContext } from "./HttpContext.js";
import { isProduction } from "./utils/isProduction.js";

export class ViewRenderer extends Component {
  static [INJECT] = [
    I18nService,
    BaseTemplateEngine,
    TemplateEngine,
    ModuleDefinitions,
  ];

  constructor(
    private readonly i18nService: I18nService,
    private readonly templateEngine: BaseTemplateEngine,
    private readonly customTemplateEngine: TemplateEngine,
    private readonly modules: ModuleDefinitions,
  ) {
    super();
  }

  public computeLocale(req: Request) {
    return pick(
      this.i18nService.availableLocales(),
      req.headers.get("accept-language") || "",
    );
  }

  public async render(
    ctx: HttpContext,
    view: string | string[],
    data: Record<string, any> = {},
  ) {
    const templates = Array.isArray(view) ? view.reverse() : [view];

    data.TITLE = "Tymber";
    data.CTX = ctx;
    data.CTX.app = data.CTX.app || {};
    data.CTX.app.isProduction = isProduction;
    data.CTX.app.modules = this.modules.modules;

    data.$t = (key: string, ...args: any[]) => {
      return this.i18nService.translate(ctx, ctx.locale, key, ...args);
    };

    for (const template of templates) {
      data.VIEW = await this.renderTemplate(ctx, template, data);
    }

    return new Response(data.VIEW, {
      headers: {
        "content-type": "text/html",
        "cache-control": "no-cache",
      },
    });
  }

  private renderTemplate(
    ctx: HttpContext,
    templateName: string,
    data: Record<string, any>,
  ) {
    if (this.customTemplateEngine.canRender(templateName)) {
      return this.customTemplateEngine.render(ctx, templateName, data);
    } else if (this.templateEngine.canRender(templateName)) {
      return this.templateEngine.render(ctx, templateName, data);
    } else {
      throw new Error(`template ${templateName} not found`);
    }
  }
}
