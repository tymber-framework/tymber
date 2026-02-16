import { type Context, type Span } from "./Context.js";

export const INJECT = Symbol("dependencies");

export type Ctor<T> = new (...args: any[]) => T;
type AbstractCtor<T> = abstract new (...args: any[]) => T;

type Dependency = Ctor<Component> | AbstractCtor<Component>;

export abstract class Component {
  private __isComponent!: void; // nominal typing

  static [INJECT]: Dependency[] = [];

  init(): void | Promise<void> {}
  close(): void | Promise<void> {}
}

interface Node {
  ctor: Ctor<Component>;
  dependencies: Ctor<Component>[];
  level: number;
}

function isSubclass(subclass: any, superclass: any): boolean {
  return superclass.prototype.isPrototypeOf(subclass.prototype);
}

function customConstructor<T extends { new (...args: any[]): any }>(
  ctor: T,
  onCreation: (instance: any) => void,
): T {
  return class extends ctor {
    constructor(...args: any[]) {
      super(...args);
      onCreation(this);
    }
  };
}

export class ComponentFactory {
  private readonly componentTree: Node[] = [];

  public register<T extends Component>(
    ctor: Ctor<T>,
    onCreation?: (instance: T) => void,
  ) {
    if (onCreation) {
      ctor = customConstructor(ctor, onCreation);
    }

    let level = 0;

    // find place in the tree
    for (const node of this.componentTree) {
      for (const dependency of node.dependencies) {
        if (ctor === dependency || isSubclass(ctor, dependency)) {
          level = Math.max(level, node.level + 1);
        }
      }
    }

    // move dependencies at the bottom
    // @ts-expect-error
    const dependencies = (ctor[INJECT] || []) as Ctor<Component>[];
    for (const node of this.componentTree) {
      for (const dependency of dependencies) {
        if (node.ctor === dependency || isSubclass(node.ctor, dependency)) {
          node.level = Math.max(node.level, level + 1);
        }
      }
    }

    this.componentTree.push({
      ctor,
      dependencies,
      level,
    });
  }

  public build(...baseComponents: Component[]) {
    const components: Component[] = [...baseComponents];

    const proxyHandler: ProxyHandler<any> = {
      get(target, prop) {
        const method = target[prop];

        if (typeof method !== "function") {
          return method;
        }

        return function (...args: any[]) {
          const isTracingEnabled = args.length > 0 && args[0].tracing?.enabled;
          if (!isTracingEnabled) {
            return method.apply(target, args);
          }

          const ctx = args[0] as Context;

          const span: Span = {
            component: target.constructor.name,
            method: prop as string,
            startedAt: Date.now(),
            duration: -1,
            isSuccess: false,
          };

          ctx.tracing?.spans.push(span);

          function completeSpan() {
            span.duration = Date.now() - span.startedAt;
          }

          try {
            const result = method.apply(target, args);

            if (isPromise(result)) {
              return result
                .then((output: any) => {
                  span.isSuccess = true;
                  return output;
                })
                .finally(() => completeSpan());
            }

            span.isSuccess = true;
            return result;
          } finally {
            completeSpan();
          }
        };
      },
    };

    this.componentTree.sort((a, b) => b.level - a.level);

    // TODO do not instantiate components that are not used in the tree
    for (const node of this.componentTree) {
      const deps = node.dependencies.map((ctor) => {
        const availableDeps = components.filter(
          (component) => component instanceof ctor,
        );

        if (availableDeps.length === 0) {
          throw `unresolved dependency ${ctor.name} for ${node.ctor.name}`;
        }

        return availableDeps[availableDeps.length - 1];
      });

      const component = new node.ctor(...deps);
      components.push(new Proxy(component, proxyHandler));
    }

    return components;
  }
}

function isPromise(obj: any) {
  return (
    !!obj &&
    typeof obj === "object" &&
    typeof obj.then === "function" &&
    typeof obj.catch === "function"
  );
}
