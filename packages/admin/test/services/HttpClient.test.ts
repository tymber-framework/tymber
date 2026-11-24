import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { emptyContext, sql, sleep, randomUUID } from "@tymber/core";
import { HttpClient } from "../../src/services/HttpClient.js";
import { hash } from "argon2";

describe("HttpClient", () => {
  let ctx: TestContext;

  before(async () => {
    process.env.ADMIN_OUTGOING_REQUESTS_FLUSH_INTERVAL_IN_MS = "10";
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should log outgoing requests", async () => {
    const httpClient = ctx.getInstance(HttpClient);

    // remove any existing logs
    await ctx.db.run(emptyContext(), sql.deleteFrom("t_outgoing_requests"));

    {
      const res = await httpClient.fetch(emptyContext(), `${ctx.baseUrl}/test`);

      assert.ok(res.ok);
      assert.equal(res.value.status, 200);
      assert.deepStrictEqual(res.value.body, {
        hello: "world",
      });
    }

    {
      const res = await httpClient.fetch(
        emptyContext(),
        `${ctx.baseUrl}/test`,
        {
          method: "POST",
          body: JSON.stringify({ test: "123" }),
          headers: {
            "content-type": "application/json",
          },
        },
      );

      assert.ok(res.ok);
      assert.equal(res.value.status, 200);
      assert.deepStrictEqual(res.value.body, {
        test: "123",
      });
    }

    {
      const res = await httpClient.fetch(
        emptyContext(),
        `${ctx.baseUrl}/throwing`,
        {
          method: "POST",
        },
      );

      assert.equal(res.ok, false);
      if (res.ok === false) {
        assert.equal(res.reason.status, 500);
      }
    }

    {
      const res = await httpClient.fetch(
        emptyContext(),
        `${ctx.baseUrl}/notfound`,
      );

      assert.equal(res.ok, false);
      if (res.ok === false) {
        assert.equal(res.reason.status, 404);
      }
    }

    {
      const res = await httpClient.fetch(
        emptyContext(),
        `http://localhost:12345`,
      );

      assert.equal(res.ok, false);
      if (res.ok === false) {
        assert.equal(res.reason.status, -1);
      }
    }

    // wait for flush
    await sleep(30);

    // verify logs
    const rows = await ctx.db.query(
      emptyContext(),
      sql.select().from("t_outgoing_requests"),
    );

    assert.equal(rows.length, 5);

    assert.deepStrictEqual(rows[0], {
      id: rows[0].id,
      created_at: rows[0].created_at,
      request_id: rows[0].request_id,
      method: "GET",
      origin: ctx.baseUrl,
      path: "/test",
      duration_in_ms: rows[0].duration_in_ms,
      status: 200,
    });

    assert.deepStrictEqual(rows[1], {
      id: rows[1].id,
      created_at: rows[1].created_at,
      request_id: rows[1].request_id,
      method: "POST",
      origin: ctx.baseUrl,
      path: "/test",
      duration_in_ms: rows[1].duration_in_ms,
      status: 200,
    });

    assert.deepStrictEqual(rows[2], {
      id: rows[2].id,
      created_at: rows[2].created_at,
      request_id: rows[2].request_id,
      method: "POST",
      origin: ctx.baseUrl,
      path: "/throwing",
      duration_in_ms: rows[2].duration_in_ms,
      status: 500,
    });

    assert.deepStrictEqual(rows[3], {
      id: rows[3].id,
      created_at: rows[3].created_at,
      request_id: rows[3].request_id,
      method: "GET",
      origin: ctx.baseUrl,
      path: "/notfound",
      duration_in_ms: rows[3].duration_in_ms,
      status: 404,
    });
  });

  it("should include cookies", async () => {
    const httpClient = ctx.getInstance(HttpClient);

    // remove any existing logs
    await ctx.db.run(emptyContext(), sql.deleteFrom("t_outgoing_requests"));

    {
      const username = randomUUID();
      await ctx.db.query(
        emptyContext(),
        sql
          .insert()
          .into("t_admin_users")
          .values([
            {
              username,
              password: await hash("abc123"),
            },
          ]),
      );

      const res = await httpClient.fetch(
        emptyContext(),
        `${ctx.baseUrl}/api/admin/login`,
        {
          method: "POST",
          body: JSON.stringify({
            username,
            password: "abc123",
          }),
          headers: {
            "content-type": "application/json",
          },
        },
      );

      assert.ok(res.ok);
      assert.equal(res.value.status, 204);
    }

    {
      const res = await httpClient.fetch(
        emptyContext(),
        `${ctx.baseUrl}/api/admin/self`,
      );

      assert.ok(res.ok);
    }

    {
      const res = await httpClient.fetch(
        emptyContext(),
        `${ctx.baseUrl}/api/admin/logout`,
        {
          method: "POST",
        },
      );

      assert.ok(res.ok);
    }

    {
      const res = await httpClient.fetch(
        emptyContext(),
        `${ctx.baseUrl}/api/admin/self`,
      );

      assert.equal(res.ok, false);
      if (res.ok === false) {
        assert.equal(res.reason.status, 401);
      }
    }

    // wait for flush
    await sleep(30);

    // verify logs
    const rows = await ctx.db.query(
      emptyContext(),
      sql.select(["*"]).from("t_outgoing_requests"),
    );

    assert.equal(rows.length, 4);
  });
});
