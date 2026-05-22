import { describe, it, before, after } from "node:test";
import * as assert from "node:assert";
import { setup, TestContext, createTodo } from "../setup";
import { emptyContext, sql } from "@tymber/core";

describe("ReadTodo", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();

    await ctx.db.query(
      emptyContext(),
      sql
        .insert()
        .into("todos")
        .values([
          {
            title: "todo #1",
            created_at: "2000-01-01T00:00:00.000Z",
            completed: false,
          },
          {
            title: "todo #2",
            created_at: "2000-01-02T00:00:00.000Z",
            completed: false,
          },
          {
            title: "todo #3",
            created_at: "2000-01-03T00:00:00.000Z",
            completed: true,
          },
        ]),
    );
  });

  after(() => ctx.close());

  it("should return some todo items", async () => {
    const res = await ctx.client.fetch({
      method: "GET",
      path: `/api/todos`,
    });

    assert.equal(res.status, 200);
    assert.partialDeepStrictEqual(res.body, [
      {
        title: "todo #1",
      },
    ]);
  });

  it("should fail to return an unknown item", async () => {
    const res = await ctx.client.fetch({
      method: "GET",
      path: `/api/todos/123`,
    });

    assert.equal(res.status, 404);
  });
});
