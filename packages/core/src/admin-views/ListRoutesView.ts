import {
  AdminView,
  type HttpContext,
  INJECT,
  ModuleDefinitions,
  type Route,
  sortBy,
} from "@tymber/common";

export class ListRoutesView extends AdminView {
  static [INJECT] = [ModuleDefinitions];

  private endpoints: Route[] = [];
  private views: Route[] = [];
  private adminEndpoints: Route[] = [];
  private adminViews: Route[] = [];

  constructor(private readonly modules: ModuleDefinitions) {
    super();
  }

  init() {
    for (const module of this.modules.modules) {
      if (module.endpoints) {
        this.endpoints.push(...module.endpoints);
      }
      if (module.views) {
        this.views.push(...module.views);
      }
      if (module.adminEndpoints) {
        this.adminEndpoints.push(...module.adminEndpoints);
      }
      if (module.adminViews) {
        this.adminViews.push(...module.adminViews);
      }
    }

    sortBy(this.endpoints, "path", "method");
    sortBy(this.views, "path", "method");
    sortBy(this.adminEndpoints, "path", "method");
    sortBy(this.adminViews, "path", "method");
  }

  override handle(ctx: HttpContext) {
    return ctx.render(["admin.layout", "admin.app-layout", "admin.routes"], {
      endpoints: this.endpoints,
      views: this.views,
      adminEndpoints: this.adminEndpoints,
      adminViews: this.adminViews,
    });
  }
}
