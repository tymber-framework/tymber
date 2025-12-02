import { Component, INJECT } from "./Component.js";
import { BaseTemplateService, TemplateService } from "./TemplateService.js";
import { I18nService } from "./I18nService.js";
import { pick } from "./contrib/accept-language-parser.js";
import { ModuleDefinitions } from "./Module.js";
import type { HttpContext } from "./HttpContext.js";
import { isProduction } from "./utils/isProduction.js";

export class ViewRenderer extends Component {
  static [INJECT] = [
    I18nService,
    BaseTemplateService,
    TemplateService,
    ModuleDefinitions,
  ];

  constructor(
    private readonly i18nService: I18nService,
    private readonly templateService: BaseTemplateService,
    private readonly customTemplateService: TemplateService,
    private readonly modules: ModuleDefinitions,
  ) {
    super();
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

    const locale = pick(
      this.i18nService.availableLocales(),
      ctx.headers.get("accept-language") || "",
    );

    data.CTX.locale = locale;

    data.$t = (key: string, ...args: any[]) => {
      return this.i18nService.translate(ctx, locale, key, ...args);
    };

    for (const template of templates) {
      data.VIEW = await this.renderTemplate(template, data);
    }

    return new Response(data.VIEW, {
      headers: {
        "content-type": "text/html",
        "cache-control": "no-cache",
      },
    });
  }

  private renderTemplate(templateName: string, data: Record<string, any>) {
    if (this.customTemplateService.canRender(templateName)) {
      return this.customTemplateService.render(templateName, data);
    } else if (this.templateService.canRender(templateName)) {
      return this.templateService.render(templateName, data);
    } else {
      throw new Error(`template ${templateName} not found`);
    }
  }
}
