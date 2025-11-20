import { Component, ComponentFactory, type Ctor } from "../Component.js";
import type { Module, ModuleDefinition } from "../Module.js";
import { type HttpMethod } from "../Router.js";
import { AdminEndpoint, Endpoint } from "../Endpoint.js";
import { AdminView, View } from "../View.js";
import { Middleware } from "../Middleware.js";
import { createDebug } from "./createDebug.js";

const debug = createDebug("loadModules");

export async function loadModules(
  componentFactory: ComponentFactory,
  modules: Module[],
) {
  const moduleDefinitions = [];

  for (const module of modules) {
    const moduleDefinition: ModuleDefinition = {
      name: module.name,
      assetsDir: module.assetsDir,
      adminSidebarItems: module.adminSidebarItems,

      endpoints: [],
      views: [],
      adminEndpoints: [],
      adminViews: [],
      middlewares: [],
    };

    const appInit = {
      component<T extends Component>(ctor: Ctor<T>) {
        debug("adding component %s", ctor.name);
        componentFactory.register(ctor);
      },

      endpoint: (method: HttpMethod, path: string, ctor: Ctor<Endpoint>) => {
        debug("adding endpoint %s %s", method, path);
        componentFactory.register(ctor, (handler) => {
          moduleDefinition.endpoints.push({
            method,
            path,
            handlerName: ctor.name,
            handler,
          });
        });
      },

      view: (path: string, ctor: Ctor<View>) => {
        debug("adding view %s", path);
        componentFactory.register(ctor, (handler) => {
          moduleDefinition.views.push({
            method: "GET",
            path,
            handlerName: ctor.name,
            handler,
          });
        });
      },

      adminEndpoint: (
        method: HttpMethod,
        path: string,
        ctor: Ctor<AdminEndpoint>,
      ) => {
        debug("adding admin endpoint %s %s", method, path);
        componentFactory.register(ctor, (handler) => {
          moduleDefinition.adminEndpoints.push({
            method,
            path,
            handlerName: ctor.name,
            handler,
          });
        });
      },

      adminView: (path: string, ctor: Ctor<AdminView>) => {
        debug("adding admin view %s", path);
        componentFactory.register(ctor, (handler) => {
          moduleDefinition.adminViews.push({
            method: "GET",
            path,
            handlerName: ctor.name,
            handler,
          });
        });
      },

      middleware: (ctor: Ctor<Middleware>) => {
        debug("adding middleware %s", ctor.name);

        componentFactory.register(ctor, (instance) => {
          moduleDefinition.middlewares.push(instance);
        });
      },
    };

    debug("loading module %s", module.name);
    module.init(appInit);

    moduleDefinitions.push(moduleDefinition);
  }

  return moduleDefinitions;
}
