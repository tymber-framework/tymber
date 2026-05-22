import { describe, it, before, after } from "node:test";
import * as assert from "node:assert";
import { setup, TestContext, createTodo } from "../setup";

describe("DeleteTodo", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should delete a todo item", async () => {
    const todoId = await createTodo(ctx);

    const res = await ctx.client.fetch({
      method: "DELETE",
      path: `/api/todos/${todoId}`,
    });

    assert.equal(res.status, 204);
  });

  it("should fail to delete an unknown item", async () => {
    const res = await ctx.client.fetch({
      method: "DELETE",
      path: `/api/todos/123`,
    });

    assert.equal(res.status, 404);
  });
});
