import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { emptyContext, sql } from "@tymber/core";

describe("ListOutgoingRequests", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();

    await ctx.db.query(emptyContext(), sql.deleteFrom("t_outgoing_requests"));

    await ctx.db.query(
      emptyContext(),
      sql
        .insert()
        .into("t_outgoing_requests")
        .values([
          {
            created_at: new Date("2000-01-01T00:00:00Z"),
            request_id: "1",
            method: "GET",
            origin: "https://example.com",
            path: "/test",
            duration_in_ms: 1,
            status: 200,
          },
          {
            created_at: new Date("2000-01-02T00:00:00Z"),
            request_id: "2",
            method: "POST",
            origin: "https://example.com",
            path: "/throwing",
            duration_in_ms: 2,
            status: 500,
          },
          {
            created_at: new Date("2000-01-03T00:00:00Z"),
            request_id: "3",
            method: "GET",
            origin: "https://example.com",
            path: "/notfound",
            duration_in_ms: 3,
            status: 404,
          },
        ]),
    );
  });

  after(() => ctx.close());

  it("should work with default values", async () => {
    const res = await ctx.adminClient.listOutgoingRequests();

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 3);

    assert.deepStrictEqual(res.body.items[0], {
      id: res.body.items[0].id,
      createdAt: "2000-01-03T00:00:00.000Z",
      requestId: "3",
      method: "GET",
      origin: "https://example.com",
      path: "/notfound",
      durationInMs: 3,
      status: 404,
    });
  });

  it("should work with sorting", async () => {
    const res = await ctx.adminClient.listOutgoingRequests({
      sort: "created_at:asc",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 3);
    assert.deepStrictEqual(res.body.items[0].requestId, "1");
  });

  it("should work with size", async () => {
    const res = await ctx.adminClient.listOutgoingRequests({
      size: 2,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 2);
  });

  it("should work with all filters", async () => {
    const res = await ctx.adminClient.listOutgoingRequests({
      sort: "created_at:desc",
      size: 1,
      from: "2000-01-01T00:00:00.000Z",
      to: "2000-01-03T00:00:00.000Z",
      requestId: "1",
      methods: ["GET"],
      origin: "https://example.com",
      statusList: [200],
      minDurationInMs: 1,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);
  });
});
