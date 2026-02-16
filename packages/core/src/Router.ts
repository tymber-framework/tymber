import { Handler } from "./Handler.js";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

type RouteMatcher = (path: string) => Record<string, string> | undefined;

type Route = {
  path: string;
  matcher: RouteMatcher;
  handlers: Map<HttpMethod, Handler>;
};

function createMatcher(path: string): RouteMatcher {
  if (!path.includes(":")) {
    return (p: string) => {
      return p === path ? {} : undefined;
    };
  }
  const pathParams: string[] = [];
  const regex = new RegExp(
    "^" +
      path.replace(/:(\w+)/g, (pathParam) => {
        pathParams.push(pathParam.substring(1));
        return "([\\w-_]+)";
      }) +
      "$",
  );

  return (path: string) => {
    const match = regex.exec(path);
    if (!match) {
      return;
    }
    const params: Record<string, string> = {};
    for (let i = 0; i < pathParams.length; i++) {
      params[pathParams[i]] = match[i + 1];
    }
    return params;
  };
}

export class Router {
  private routes: Route[] = [];

  public registerRoute(method: HttpMethod, path: string, handler: Handler) {
    for (const route of this.routes) {
      if (route.path === path) {
        route.handlers.set(method, handler);
        return;
      }
    }
    this.routes.push({
      path,
      matcher: createMatcher(path),
      handlers: new Map([[method, handler]]),
    });
  }

  public findRoute(method: HttpMethod, path: string) {
    for (const route of this.routes) {
      const pathParams = route.matcher(path);
      if (pathParams !== undefined && route.handlers.has(method)) {
        return {
          handler: route.handlers.get(method)!,
          pathParams,
        };
      }
    }
  }
}
