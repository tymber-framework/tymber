import { beforeEach, describe, it } from "node:test";
import * as assert from "node:assert";
import { View } from "../../src";
import { Router } from "../../src/Router.js";

class DummyController extends View {
  handle() {
    return Response.json({ status: "OK" });
  }
}

describe("Router", () => {
  let router: Router;

  beforeEach(() => {
    router = new Router();
  });

  it("should find the correct handler (plain)", () => {
    const handler = new DummyController();

    router.registerRoute("GET", "/api/tes", new DummyController());
    router.registerRoute("GET", "/api/test1", new DummyController());
    router.registerRoute("GET", "/api/test/1", new DummyController());
    router.registerRoute("POST", "/api/test", new DummyController());
    router.registerRoute("GET", "/api/test", handler);

    const route = router.findRoute("GET", "/api/test");
    assert.ok(route);
    assert.strictEqual(route.handler, handler);
    assert.deepEqual(route.pathParams, {});
    assert.strictEqual(route.matchedRoute, "/api/test");
  });

  it("should find the correct handler (regex)", () => {
    const handler = new DummyController();

    router.registerRoute("GET", "/:p1/:p2/:p3", handler);

    const route = router.findRoute("GET", "/abc/123/d-e_f");
    assert.ok(route);
    assert.strictEqual(route.handler, handler);
    assert.deepEqual(route.pathParams, {
      p1: "abc",
      p2: "123",
      p3: "d-e_f",
    });
    assert.strictEqual(route.matchedRoute, "/:p1/:p2/:p3");
  });

  it("should return undefined if no route matches", () => {
    const route = router.findRoute("GET", "/api/test");

    assert.equal(route, undefined);
  });

  it("should match route with parameters and return matchedRoute", () => {
    const handler = new DummyController();

    router.registerRoute("GET", "/api/articles/:articleId", handler);

    const route = router.findRoute("GET", "/api/articles/1");
    assert.ok(route);
    assert.strictEqual(route.handler, handler);
    assert.deepEqual(route.pathParams, {
      articleId: "1",
    });
    assert.strictEqual(route.matchedRoute, "/api/articles/:articleId");
  });

  it("should match nested route with parameters and return matchedRoute", () => {
    const handler = new DummyController();

    router.registerRoute("GET", "/api/users/:userId/posts/:postId", handler);

    const route = router.findRoute("GET", "/api/users/123/posts/456");
    assert.ok(route);
    assert.strictEqual(route.handler, handler);
    assert.deepEqual(route.pathParams, {
      userId: "123",
      postId: "456",
    });
    assert.strictEqual(route.matchedRoute, "/api/users/:userId/posts/:postId");
  });
});
