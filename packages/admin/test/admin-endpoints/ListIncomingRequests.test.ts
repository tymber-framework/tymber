import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { emptyContext, sql } from "@tymber/core";

describe("ListIncomingRequests", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();

    await ctx.db.query(emptyContext(), sql.deleteFrom("t_incoming_requests"));

    await ctx.db.query(
      emptyContext(),
      sql
        .insert()
        .into("t_incoming_requests")
        .values([
          {
            created_at: new Date("2000-01-01T00:00:00Z"),
            request_id: "1",
            method: "GET",
            matched_route: "/test",
            path: "/test",
            duration_in_ms: 1,
            status: 200,
            user_id: null,
          },
          {
            created_at: new Date("2000-01-02T00:00:00Z"),
            request_id: "2",
            method: "POST",
            matched_route: "/throwing",
            path: "/throwing",
            duration_in_ms: 2,
            status: 500,
            user_id: null,
          },
          {
            created_at: new Date("2000-01-03T00:00:00Z"),
            request_id: "3",
            method: "GET",
            matched_route: null,
            path: "/notfound",
            duration_in_ms: 3,
            status: 404,
            user_id: null,
          },
        ]),
    );
  });

  after(() => ctx.close());

  it("should work with default values", async () => {
    const res = await ctx.adminClient.listIncomingRequests();

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 3);

    assert.deepStrictEqual(res.body.items[0], {
      id: res.body.items[0].id,
      createdAt: "2000-01-03T00:00:00.000Z",
      requestId: "3",
      method: "GET",
      matchedRoute: null,
      path: "/notfound",
      durationInMs: 3,
      status: 404,
      userId: null,
    });
  });

  it("should work with sorting", async () => {
    const res = await ctx.adminClient.listIncomingRequests({
      sort: "created_at:asc",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 3);
    assert.deepStrictEqual(res.body.items[0].requestId, "1");
  });

  it("should work with size", async () => {
    const res = await ctx.adminClient.listIncomingRequests({
      size: 2,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 2);
  });

  it("should work with all filters", async () => {
    const res = await ctx.adminClient.listIncomingRequests({
      sort: "created_at:desc",
      size: 1,
      from: "2000-01-01T00:00:00.000Z",
      to: "2000-01-03T00:00:00.000Z",
      requestId: "1",
      methods: ["GET"],
      matchedRoute: "/test",
      statusList: [200],
      minDurationInMs: 1,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);
  });
});
