import { describe, it, before, after } from "node:test";
import * as assert from "node:assert";
import { setup, TestContext, createTodo } from "../setup";

describe("UpdateTodo", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should update a todo item", async () => {
    const todoId = await createTodo(ctx);

    const res = await ctx.client.fetch({
      method: "PUT",
      path: `/api/todos/${todoId}`,
      payload: {
        title: "todo item",
        completed: true,
      },
    });

    assert.equal(res.status, 204);
  });

  it("should fail to update an unknown item", async () => {
    const res = await ctx.client.fetch({
      method: "PUT",
      path: `/api/todos/123`,
      payload: {
        title: "todo item",
        completed: true,
      },
    });

    assert.equal(res.status, 404);
  });
});
