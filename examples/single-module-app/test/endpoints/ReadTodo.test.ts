import { describe, it, before, after } from "node:test";
import * as assert from "node:assert";
import { setup, TestContext, createTodo } from "../setup";

describe("ReadTodo", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should return a todo item", async () => {
    const todoId = await createTodo(ctx);

    const res = await ctx.client.fetch({
      method: "GET",
      path: `/api/todos/${todoId}`,
    });

    assert.equal(res.status, 200);
    assert.partialDeepStrictEqual(res.body, {
      id: todoId,
      completed: false,
    });
  });

  it("should fail to return an unknown item", async () => {
    const res = await ctx.client.fetch({
      method: "GET",
      path: `/api/todos/123`,
    });

    assert.equal(res.status, 404);
  });
});
