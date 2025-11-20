import { Component, INJECT } from "./Component.js";
import { BaseTemplateService, TemplateService } from "./TemplateService.js";
import { I18nService } from "./I18nService.js";
import { pick } from "./contrib/accept-language-parser.js";
import { type AdminSidebarItem, ModuleDefinitions } from "./Module.js";
import type { HttpContext } from "./HttpContext.js";

export class ViewRenderer extends Component {
  static [INJECT] = [
    I18nService,
    BaseTemplateService,
    TemplateService,
    ModuleDefinitions,
  ];

  private adminSidebarItems: AdminSidebarItem[] = [];

  constructor(
    private readonly i18nService: I18nService,
    private readonly templateService: BaseTemplateService,
    private readonly customTemplateService: TemplateService,
    modules: ModuleDefinitions,
  ) {
    super();
    for (const module of modules.modules) {
      if (module.adminSidebarItems) {
        this.adminSidebarItems.push(...module.adminSidebarItems);
      }
    }
  }

  public async render(
    ctx: HttpContext,
    layout: string | null,
    view: string,
    data: Record<string, any> = {},
  ) {
    data.CTX = ctx;

    if (view.startsWith("admin.")) {
      data.APP = {
        adminSidebarItems: this.adminSidebarItems,
      };
    }

    const locale = pick(
      this.i18nService.availableLocales(),
      ctx.headers.get("accept-language") || "",
    );

    data.$t = (key: string, ...args: any[]) => {
      return this.i18nService.translate(ctx, locale, key, ...args);
    };

    let output = await this.renderTemplate(view, data);

    if (layout) {
      data.view = output;

      output = await this.renderTemplate(layout, data);
    }

    return new Response(output, {
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
