import { Component, type Ctor } from "./Component.js";
import type { HttpMethod } from "./Router.js";
import { AdminEndpoint, Endpoint, UserEndpoint } from "./Endpoint.js";
import { AdminView, UserView, View } from "./View.js";
import { Middleware } from "./Middleware.js";
import { type Handler } from "./Handler.js";

export interface AdminSidebarItem {
  label: string;
  icon: string;
  path: string;
}

export interface Module {
  name: string;
  version: string;
  assetsDir?: string;
  adminSidebarItems?: AdminSidebarItem[];

  init(app: AppInit): void;
}

export interface AppInit {
  component<T extends Component>(ctor: Ctor<T>): void;
  endpoint(method: HttpMethod, path: string, ctor: Ctor<Endpoint>): void;
  view(path: string, ctor: Ctor<View>): void;
  userEndpoint(
    method: HttpMethod,
    path: string,
    ctor: Ctor<UserEndpoint>,
  ): void;
  userView(path: string, ctor: Ctor<UserView>): void;
  adminEndpoint(
    method: HttpMethod,
    path: string,
    ctor: Ctor<AdminEndpoint>,
  ): void;
  adminView(path: string, ctor: Ctor<AdminView>): void;
  middleware(ctor: Ctor<Middleware>): void;
}

export interface Route {
  method: HttpMethod;
  path: string;
  handlerName: string;
  handler: Handler;
}

export interface ModuleDefinition {
  name: string;
  version: string;
  assetsDir?: string;
  adminSidebarItems?: AdminSidebarItem[];

  endpoints: Route[];
  views: Route[];
  userEndpoints: Route[];
  userViews: Route[];
  adminEndpoints: Route[];
  adminViews: Route[];
  middlewares: Middleware[];
}

export class ModuleDefinitions extends Component {
  constructor(public readonly modules: ModuleDefinition[]) {
    super();
  }
}
