import {
  AdminView,
  type HttpContext,
  INJECT,
  ModuleDefinitions,
  type Route,
  sortBy,
} from "@tymber/core";

export class ListRoutesView extends AdminView {
  static [INJECT] = [ModuleDefinitions];

  private endpoints: Route[] = [];
  private views: Route[] = [];
  private userEndpoints: Route[] = [];
  private userViews: Route[] = [];
  private adminEndpoints: Route[] = [];
  private adminViews: Route[] = [];

  constructor(private readonly modules: ModuleDefinitions) {
    super();
  }

  init() {
    for (const module of this.modules.modules) {
      this.endpoints.push(...module.endpoints);
      this.views.push(...module.views);
      this.userEndpoints.push(...module.userEndpoints);
      this.userViews.push(...module.userViews);
      this.adminEndpoints.push(...module.adminEndpoints);
      this.adminViews.push(...module.adminViews);
    }

    sortBy(this.endpoints, "path", "method");
    sortBy(this.views, "path", "method");
    sortBy(this.userEndpoints, "path", "method");
    sortBy(this.userViews, "path", "method");
    sortBy(this.adminEndpoints, "path", "method");
    sortBy(this.adminViews, "path", "method");
  }

  override handle(ctx: HttpContext) {
    return ctx.render(["admin.layout", "admin.app-layout", "admin.routes"], {
      endpoints: this.endpoints,
      views: this.views,
      userEndpoints: this.userEndpoints,
      userViews: this.userViews,
      adminEndpoints: this.adminEndpoints,
      adminViews: this.adminViews,
    });
  }
}
