import { type HttpMethod, Router } from "./Router.js";
import {
  type Module,
  type ModuleDefinition,
  ModuleDefinitions,
} from "./Module.js";
import { Middleware } from "./Middleware.js";
import { parseCookieHeader } from "./contrib/cookie.js";
import { type HttpContext, HttpRedirectCode } from "./HttpContext.js";
import { computeBaseUrl } from "./utils/computeBaseUrl.js";
import { ViewRenderer } from "./ViewRenderer.js";
import { computeContentType } from "./utils/computeContentType.js";
import { loadModules } from "./utils/loadModules.js";
import { BaseI18nService } from "./I18nService.js";
import { BaseTemplateService } from "./TemplateService.js";
import { runMigrations } from "./utils/runMigrations.js";
import { createDebug } from "./utils/createDebug.js";
import type { DB } from "./DB.js";
import { isProduction } from "./utils/isProduction.js";
import { ComponentFactory } from "./Component.js";
import { PubSubService } from "./PubSubService.js";
import { FS } from "./utils/fs.js";
import { EnvironmentBasedConfigService } from "./ConfigService.js";

const debug = createDebug("App");

function createRouter(modules: ModuleDefinition[]) {
  const router = new Router();

  for (const module of modules) {
    for (const { method, path, handler } of module.endpoints) {
      router.registerRoute(method, path, handler);
    }

    for (const { method, path, handler } of module.views) {
      router.registerRoute(method, path, handler);
    }

    for (const { method, path, handler } of module.adminEndpoints) {
      router.registerRoute(method, path, handler);
    }

    for (const { method, path, handler } of module.adminViews) {
      router.registerRoute(method, path, handler);
    }
  }

  return router;
}

export class App {
  private readonly router: Router;
  private readonly middlewares: Middleware[] = [];

  private constructor(
    modules: ModuleDefinition[],
    private readonly assets: Map<string, string>,
    private readonly viewRenderer: ViewRenderer,
  ) {
    this.router = createRouter(modules);
    for (const module of modules) {
      this.middlewares.push(...module.middlewares);
    }
    this.fetch = this.fetch.bind(this);
  }

  static async create(db: DB, modules: Module[]) {
    debug(
      "starting app in %s mode",
      isProduction ? "production" : "development",
    );

    const componentFactory = new ComponentFactory();

    let viewRenderer: ViewRenderer;

    componentFactory.register(PubSubService);
    componentFactory.register(EnvironmentBasedConfigService);
    componentFactory.register(BaseI18nService);
    componentFactory.register(BaseTemplateService);
    componentFactory.register(ViewRenderer, (instance) => {
      viewRenderer = instance;
    });

    debug("loading modules");
    const moduleDefinitions = await loadModules(componentFactory, modules);
    const components = componentFactory.build(
      db,
      new ModuleDefinitions(moduleDefinitions),
    );

    debug("running migrations");
    await runMigrations(db, moduleDefinitions);

    debug("initializing all components");
    await Promise.all(components.map((component) => component.init()));

    const assets = new Map<string, string>();

    for (const module of modules) {
      if (!module.assetsDir) {
        continue;
      }

      try {
        for (const filename of await FS.readDirRecursively(
          FS.join(module.assetsDir, "static"),
        )) {
          assets.set(
            "/static/" + filename,
            FS.join(module.assetsDir, "static", filename),
          );
        }
      } catch (e) {}
    }

    const app = new App(moduleDefinitions, assets, viewRenderer!);

    app.close = () => {
      debug("closing all components");
      return Promise.all(
        components.map((component) => component.close()),
      ).then();
    };

    return app;
  }

  public async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url, "http://localhost");

    const ctx = {
      startedAt: new Date(),
      method: req.method as HttpMethod,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      headers: req.headers,
      cookies: parseCookieHeader(req.headers.get("cookie") || ""),
      abortSignal: req.signal,
      responseHeaders: new Headers(),

      render: async (view, data = {}) => {
        try {
          return this.viewRenderer.render(ctx, view, data);
        } catch (e) {
          return this.renderHttp500Error(ctx, e as Error);
        }
      },

      redirect(
        path: string,
        code: HttpRedirectCode = HttpRedirectCode.HTTP_302_FOUND,
      ) {
        const baseUrl = computeBaseUrl(ctx.headers);
        // note: `Response.redirect()` does not allow to specify additional headers
        return new Response(null, {
          status: code,
          headers: {
            Location: `${baseUrl}${path}`,
          },
        });
      },
    } as HttpContext;

    if (ctx.path.startsWith("/static")) {
      if (!this.assets.has(ctx.path)) {
        return this.renderHttp404Error(ctx);
      }
      const contentType = computeContentType(ctx.path);
      const absolutePath = this.assets.get(ctx.path)!;

      debug("serving %s with content type %s", ctx.path, contentType);
      return new Response(FS.createReadStream(absolutePath), {
        headers: {
          "content-type": contentType,
          "cache-control": isProduction
            ? "public, max-age=31536000, immutable"
            : "no-cache",
        },
      });
    }

    // make a copy in case a middleware is removed
    const middlewares = this.middlewares.slice();

    for (const middleware of middlewares) {
      try {
        const httpRes = await middleware.handle(ctx);

        if (httpRes) {
          ctx.responseHeaders.forEach((value, key) => {
            httpRes.headers.set(key, value);
          });

          return httpRes;
        }
      } catch (e) {
        return this.renderHttp500Error(ctx, e as Error);
      }
    }

    const route = this.router.findRoute(req.method as HttpMethod, url.pathname);

    if (!route) {
      return this.renderHttp404Error(ctx);
    }

    ctx.pathParams = route.pathParams;

    const contentType = req.headers.get("content-type");

    if (contentType) {
      if (contentType !== "application/json") {
        // TODO support other content types
        return Response.json(
          {
            message: "unsupported media type",
          },
          {
            status: 415,
          },
        );
      }

      try {
        ctx.payload = await req.json();
      } catch {
        return Response.json(
          {
            message: "invalid request body",
          },
          {
            status: 400,
          },
        );
      }
    }

    try {
      const httpRes = await route.handler.doHandle(ctx);

      ctx.responseHeaders.forEach((value, key) => {
        httpRes.headers.set(key, value);
      });

      return httpRes;
    } catch (e) {
      return this.renderHttp500Error(ctx, e as Error);
    }
  }

  private renderHttp404Error(ctx: HttpContext) {
    const acceptHeader = ctx.headers.get("accept");

    if (acceptHeader?.includes("text/html")) {
      return this.viewRenderer.render(ctx, "404");
    } else {
      return Response.json(
        {
          message: "resource not found",
        },
        {
          status: 404,
        },
      );
    }
  }

  private renderHttp500Error(ctx: HttpContext, error: Error) {
    const acceptHeader = ctx.headers.get("accept");

    if (acceptHeader?.includes("text/html")) {
      return this.viewRenderer.render(ctx, "500", {
        error,
      });
    } else {
      return Response.json(
        {
          message: "an unexpected error occurred",
        },
        {
          status: 500,
        },
      );
    }
  }

  public close() {
    return Promise.resolve();
  }
}
