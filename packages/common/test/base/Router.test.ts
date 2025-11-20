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
  });

  it("should return undefined if no route matches", () => {
    const route = router.findRoute("GET", "/api/test");

    assert.equal(route, undefined);
  });
});
