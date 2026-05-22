import { describe, it, before, after } from "node:test";
import * as assert from "node:assert";
import { setup, TestContext } from "../setup";

describe("CreateTodo", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should create a todo item", async () => {
    const res = await ctx.client.fetch({
      method: "POST",
      path: "/api/todos",
      payload: {
        title: "test1",
      },
    });

    assert.equal(res.status, 201);
    assert.partialDeepStrictEqual(res.body, {
      title: "test1",
      completed: false,
    });
  });

  it("should reject a todo item without a title", async () => {
    const res = await ctx.client.fetch({
      method: "POST",
      path: "/api/todos",
      payload: {
        id: 123,
      },
    });

    assert.equal(res.status, 400);
  });
});
