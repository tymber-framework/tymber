import { beforeEach, describe, it } from "node:test";
import * as assert from "node:assert";
import {
  Component,
  ComponentFactory,
  Context,
  emptyContext,
  INJECT,
} from "../../src";

describe("ComponentFactory", () => {
  let factory: ComponentFactory;

  beforeEach(() => {
    factory = new ComponentFactory();
  });

  it("should create the tree of components", async () => {
    class A extends Component {}

    class B extends Component {
      static [INJECT] = [A];

      constructor(readonly a: A) {
        super();
      }
    }

    class C extends Component {
      static [INJECT] = [B];

      constructor(readonly b: B) {
        super();
      }
    }

    class D extends Component {
      static [INJECT] = [B];

      constructor(readonly b: B) {
        super();
      }
    }

    factory.register(A);
    factory.register(B);
    factory.register(C);
    factory.register(D);

    const components = factory.build();

    assert.equal(components.length, 4);
    assert.ok(components[0] instanceof A);
    assert.ok(components[1] instanceof B);
    assert.ok(components[2] instanceof C);
    assert.ok(components[3] instanceof D);
    assert.ok(components[2].b === components[1]);
    assert.ok(components[3].b === components[1]);
  });

  it("should inject the implementation of an abstract dependency", async () => {
    abstract class A extends Component {
      abstract doSomething(): void;
    }

    class B extends A {
      doSomething() {}
    }

    class C extends Component {
      static [INJECT] = [A];

      constructor(readonly a: A) {
        super();
      }
    }

    factory.register(B);
    factory.register(C);

    const components = factory.build();

    assert.equal(components.length, 2);
    assert.ok(components[0] instanceof B);
    assert.ok(components[1] instanceof C);
    assert.ok(components[1].a === components[0]);
  });

  it("should inject all dependencies (explicit)", async () => {
    class A extends Component {}
    class B extends Component {}

    abstract class C extends Component {
      static [INJECT] = [A];

      constructor(readonly a: A) {
        super();
      }
    }

    class D extends C {
      static [INJECT] = [A, B];

      constructor(
        readonly a: A,
        readonly b: B,
      ) {
        super(a);
      }
    }

    factory.register(A);
    factory.register(B);
    factory.register(D);

    const components = factory.build();

    assert.equal(components.length, 3);
    assert.ok(components[0] instanceof A);
    assert.ok(components[1] instanceof B);
    assert.ok(components[2] instanceof D);
    assert.ok(components[2].a === components[0]);
    assert.ok(components[2].b === components[1]);
  });

  it("should inject all dependencies (implicit)", async () => {
    class A extends Component {}

    abstract class B extends Component {
      static [INJECT] = [A];

      constructor(readonly a: A) {
        super();
      }
    }

    class C extends B {}

    factory.register(A);
    factory.register(C);

    const components = factory.build();

    assert.equal(components.length, 2);
    assert.ok(components[0] instanceof A);
    assert.ok(components[1] instanceof C);
    assert.ok(components[1].a === components[0]);
  });

  it("should inject the last matching implementation", async () => {
    abstract class SomeService extends Component {}

    class FirstImpl extends SomeService {}
    class SecondImpl extends SomeService {}

    class Controller extends Component {
      static [INJECT] = [SomeService];

      constructor(readonly service: SomeService) {
        super();
      }
    }

    factory.register(FirstImpl);
    factory.register(SecondImpl);
    factory.register(Controller);

    const components = factory.build();

    assert.equal(components.length, 3);
    assert.ok(components[0] instanceof FirstImpl);
    assert.ok(components[1] instanceof SecondImpl);
    assert.ok(components[2] instanceof Controller);
    assert.ok(components[2].service instanceof SecondImpl);
  });

  it("should inject a manually-created component", async () => {
    class A extends Component {}

    class B extends Component {
      static [INJECT] = [A];

      constructor(readonly a: A) {
        super();
      }
    }

    factory.register(B);

    const a = new A();
    const components = factory.build(a);

    assert.equal(components.length, 2);
    assert.ok(components[0] === a);
    assert.ok(components[1] instanceof B);
    assert.ok(components[1].a === a);
  });

  it("should throw when a dependency cannot be resolved", async () => {
    class A extends Component {}

    class B extends Component {
      static [INJECT] = [A];
    }

    factory.register(B);

    try {
      factory.build();
      assert.fail();
    } catch (e) {
      assert.equal(e, "unresolved dependency A for B");
    }
  });

  it("should throw on cyclic dependencies", async () => {
    class A extends Component {}

    class B extends Component {
      static [INJECT] = [A];
    }

    class C extends A {
      static [INJECT] = [B];
    }

    factory.register(B);
    factory.register(C);

    try {
      factory.build();
      assert.fail();
    } catch (e) {
      assert.equal(e, "unresolved dependency A for B");
    }
  });
});

describe("tracing", () => {
  let factory: ComponentFactory;

  beforeEach(() => {
    factory = new ComponentFactory();
  });

  it("should add a span for each component", () => {
    class A extends Component {
      methodA(ctx: Context) {
        return 1;
      }
    }

    class B extends Component {
      static [INJECT] = [A];

      constructor(readonly a: A) {
        super();
      }

      methodB(ctx: Context) {
        return this.a.methodA(ctx);
      }
    }

    class C extends Component {
      static [INJECT] = [B];

      constructor(readonly b: B) {
        super();
      }

      methodC(ctx: Context) {
        return this.b.methodB(ctx);
      }
    }

    factory.register(A);
    factory.register(B);
    factory.register(C);

    const components = factory.build();

    assert.ok(components[2] instanceof C);

    const c = components[2] as C;
    const ctx = emptyContext();
    ctx.tracing.enabled = true;

    const result = c.methodC(ctx);

    assert.equal(result, 1);
    assert.equal(ctx.tracing.spans.length, 3);

    const span1 = ctx.tracing.spans[0];

    assert.equal(span1.component, "C");
    assert.equal(span1.method, "methodC");
    assert.equal(span1.isSuccess, true);
  });

  it("should add a span for each component (async)", async () => {
    class A extends Component {
      methodA(ctx: Context) {
        return Promise.resolve(1);
      }
    }

    class B extends Component {
      static [INJECT] = [A];

      constructor(readonly a: A) {
        super();
      }

      methodB(ctx: Context) {
        return this.a.methodA(ctx);
      }
    }

    class C extends Component {
      static [INJECT] = [B];

      constructor(readonly b: B) {
        super();
      }

      methodC(ctx: Context) {
        return this.b.methodB(ctx);
      }
    }

    factory.register(A);
    factory.register(B);
    factory.register(C);

    const components = factory.build();

    assert.ok(components[2] instanceof C);

    const c = components[2] as C;
    const ctx = emptyContext();
    ctx.tracing.enabled = true;

    const result = await c.methodC(ctx);

    assert.equal(result, 1);
    assert.equal(ctx.tracing.spans.length, 3);

    const span1 = ctx.tracing.spans[0];

    assert.equal(span1.component, "C");
    assert.equal(span1.method, "methodC");
    assert.equal(span1.isSuccess, true);
  });

  it("should handle exceptions", () => {
    class A extends Component {
      methodA(ctx: Context) {
        throw "error!";
      }
    }

    class B extends Component {
      static [INJECT] = [A];

      constructor(readonly a: A) {
        super();
      }

      methodB(ctx: Context) {
        this.a.methodA(ctx);
      }
    }

    class C extends Component {
      static [INJECT] = [B];

      constructor(readonly b: B) {
        super();
      }

      methodC(ctx: Context) {
        this.b.methodB(ctx);
      }
    }

    factory.register(A);
    factory.register(B);
    factory.register(C);

    const components = factory.build();

    assert.ok(components[2] instanceof C);

    const c = components[2] as C;
    const ctx = emptyContext();
    ctx.tracing.enabled = true;

    try {
      c.methodC(ctx);
      assert.fail();
    } catch (e) {
      assert.equal(e, "error!");
    }

    assert.equal(ctx.tracing.spans.length, 3);

    const span3 = ctx.tracing.spans[2];

    assert.equal(span3.component, "A");
    assert.equal(span3.method, "methodA");
    assert.equal(span3.isSuccess, false);
  });

  it("should handle promise rejections", async () => {
    class A extends Component {
      methodA(ctx: Context) {
        return Promise.reject("error!");
      }
    }

    class B extends Component {
      static [INJECT] = [A];

      constructor(readonly a: A) {
        super();
      }

      methodB(ctx: Context) {
        return this.a.methodA(ctx);
      }
    }

    class C extends Component {
      static [INJECT] = [B];

      constructor(readonly b: B) {
        super();
      }

      methodC(ctx: Context) {
        return this.b.methodB(ctx);
      }
    }

    factory.register(A);
    factory.register(B);
    factory.register(C);

    const components = factory.build();

    assert.ok(components[2] instanceof C);

    const c = components[2] as C;
    const ctx = emptyContext();
    ctx.tracing.enabled = true;

    try {
      await c.methodC(ctx);
      assert.fail();
    } catch (e) {
      assert.equal(e, "error!");
    }

    assert.equal(ctx.tracing.spans.length, 3);

    const span3 = ctx.tracing.spans[2];

    assert.equal(span3.component, "A");
    assert.equal(span3.method, "methodA");
    assert.equal(span3.isSuccess, false);
  });

  it("should handle context-less methods", () => {
    class A extends Component {
      methodA() {}
    }

    class B extends Component {
      static [INJECT] = [A];

      constructor(readonly a: A) {
        super();
      }

      methodB(ctx: Context) {
        return this.a.methodA();
      }
    }

    class C extends Component {
      static [INJECT] = [B];

      constructor(readonly b: B) {
        super();
      }

      methodC(arg: string, ctx: Context) {
        return this.b.methodB(ctx);
      }
    }

    factory.register(A);
    factory.register(B);
    factory.register(C);

    const components = factory.build();

    assert.ok(components[2] instanceof C);

    const c = components[2] as C;
    const ctx = emptyContext();
    ctx.tracing.enabled = true;

    c.methodC("hello", ctx);

    assert.equal(ctx.tracing.spans.length, 1);

    const span2 = ctx.tracing.spans[0];

    assert.equal(span2.component, "B");
    assert.equal(span2.method, "methodB");
    assert.equal(span2.isSuccess, true);
  });
});
