import { Handler } from "./Handler.js";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

type TrieNode = {
  staticChildren: Map<string, TrieNode>;
  dynamicChild?: {
    paramName: string;
    node: TrieNode;
  };
  handlers: Map<HttpMethod, Handler>;
};

function createTrieNode(): TrieNode {
  return {
    staticChildren: new Map(),
    handlers: new Map(),
  };
}

export class Router {
  private staticRoutes = new Map<string, Map<HttpMethod, Handler>>();
  private trieRoot = createTrieNode();

  public registerRoute(method: HttpMethod, path: string, handler: Handler) {
    if (!path.includes(":")) {
      let methodMap = this.staticRoutes.get(path);
      if (!methodMap) {
        methodMap = new Map();
        this.staticRoutes.set(path, methodMap);
      }
      methodMap.set(method, handler);
      return;
    }

    const segments = path.split("/").filter((s) => s.length > 0);
    let currentNode = this.trieRoot;

    for (const segment of segments) {
      if (segment.startsWith(":")) {
        const paramName = segment.substring(1);
        if (!currentNode.dynamicChild) {
          currentNode.dynamicChild = {
            paramName,
            node: createTrieNode(),
          };
        }
        currentNode = currentNode.dynamicChild.node;
      } else {
        let nextNode = currentNode.staticChildren.get(segment);
        if (!nextNode) {
          nextNode = createTrieNode();
          currentNode.staticChildren.set(segment, nextNode);
        }
        currentNode = nextNode;
      }
    }
    currentNode.handlers.set(method, handler);
  }

  public findRoute(method: HttpMethod, path: string) {
    const staticHandler = this.staticRoutes.get(path)?.get(method);
    if (staticHandler) {
      return {
        handler: staticHandler,
        pathParams: {},
      };
    }

    const segments = path.split("/").filter((s) => s.length > 0);
    let currentNode = this.trieRoot;
    const pathParams: Record<string, string> = {};

    for (const segment of segments) {
      const nextNode = currentNode.staticChildren.get(segment);
      if (nextNode) {
        currentNode = nextNode;
      } else if (currentNode.dynamicChild) {
        pathParams[currentNode.dynamicChild.paramName] = segment;
        currentNode = currentNode.dynamicChild.node;
      } else {
        return;
      }
    }

    const handler = currentNode.handlers.get(method);
    if (handler) {
      return {
        handler,
        pathParams,
      };
    }
  }
}
