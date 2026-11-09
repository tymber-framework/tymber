import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { setup, type TestContext } from "../setup.js";
import { emptyContext, sql } from "@tymber/core";

function id(id: number) {
  // BigInts are serialized as strings
  return process.env.USE_SQLITE ? id : String(id);
}

describe("ListLogs", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();

    await ctx.db.run(
      emptyContext(),
      sql
        .insert()
        .into("t_logs")
        .values([
          {
            id: 1,
            level: 0,
            component: "test-component-1",
            message: "Test log 1",
            created_at: new Date("2000-01-01T00:00:00.000Z"),
          },
          {
            id: 2,
            level: 1,
            component: "test-component-2",
            message: "Test log 2",
            created_at: new Date("2000-01-02T00:00:00.000Z"),
          },
          {
            id: 3,
            level: 2,
            component: "test-component-1",
            message: "Test log 3",
            created_at: new Date("2000-01-03T00:00:00.000Z"),
          },
          {
            id: 4,
            level: 3,
            component: undefined,
            message: "Test log 4 (error)",
            created_at: new Date("2000-01-04T00:00:00.000Z"),
          },
        ]),
    );
  });

  after(() => ctx.close());

  it("should work with default values", async () => {
    const res = await ctx.adminClient.listLogs();

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 4);
    assert.deepEqual(res.body.items, [
      {
        id: id(1),
        level: "debug",
        component: "test-component-1",
        message: "Test log 1",
        createdAt: "2000-01-01T00:00:00.000Z",
      },
      {
        id: id(2),
        level: "info",
        component: "test-component-2",
        message: "Test log 2",
        createdAt: "2000-01-02T00:00:00.000Z",
      },
      {
        id: id(3),
        level: "warn",
        component: "test-component-1",
        message: "Test log 3",
        createdAt: "2000-01-03T00:00:00.000Z",
      },
      {
        id: id(4),
        level: "error",
        component: null,
        message: "Test log 4 (error)",
        createdAt: "2000-01-04T00:00:00.000Z",
      },
    ]);
  });

  it("should work with sorting by descending date", async () => {
    const res = await ctx.adminClient.listLogs({
      sort: "created_at:desc",
    });

    assert.equal(res.status, 200);
    assert.partialDeepStrictEqual(res.body.items, [
      {
        id: id(4),
      },
      {
        id: id(3),
      },
      {
        id: id(2),
      },
      {
        id: id(1),
      },
    ]);
  });

  it("should work with levels filter", async () => {
    const res = await ctx.adminClient.listLogs({
      levels: ["warn"],
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);
    assert.equal(res.body.items[0].id, id(3));
    assert.equal(res.body.items[0].level, "warn");
  });

  it("should work with components filter", async () => {
    const res = await ctx.adminClient.listLogs({
      components: ["test-component-1"],
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 2);
    assert.equal(res.body.items[0].id, id(1));
    assert.equal(res.body.items[1].id, id(3));
  });

  it("should work with from filter", async () => {
    const res = await ctx.adminClient.listLogs({
      from: "2000-01-02T00:00:00.000Z",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 3);
    assert.equal(res.body.items[0].id, id(2));
    assert.equal(res.body.items[1].id, id(3));
    assert.equal(res.body.items[2].id, id(4));
  });

  it("should work with to filter", async () => {
    const res = await ctx.adminClient.listLogs({
      to: "2000-01-02T00:00:00.000Z",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 2);
    assert.equal(res.body.items[0].id, id(1));
    assert.equal(res.body.items[1].id, id(2));
  });

  it("should work with pagination", async () => {
    const res = await ctx.adminClient.listLogs({
      page: 1,
      size: 2,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 2);
    assert.equal(res.body.items[0].id, id(1));
    assert.equal(res.body.items[1].id, id(2));
  });

  it("should work with second page of pagination", async () => {
    const res = await ctx.adminClient.listLogs({
      page: 2,
      size: 2,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 2);
    assert.equal(res.body.items[0].id, id(3));
    assert.equal(res.body.items[1].id, id(4));
  });

  it("should work with combined filters", async () => {
    const res = await ctx.adminClient.listLogs({
      levels: ["debug"],
      components: ["test-component-1"],
      from: "2000-01-01T00:00:00.000Z",
      to: "2000-01-01T23:59:59.999Z",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);
    assert.equal(res.body.items[0].id, id(1));
  });
});
