import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { randomUUID } from "node:crypto";
import { hash } from "argon2";
import { emptyContext, parseCookieHeader, sql } from "@tymber/common";
import { AdminClient } from "@tymber/client";

describe("LogIn", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
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

    const defaultHeaders = {
      cookie: "",
    };
    const client = new AdminClient(ctx.baseUrl, defaultHeaders);

    const res = await client.logIn({
      username,
      password: "abc123",
    });

    assert.equal(res.status, 204);

    const cookies = parseCookieHeader(res.headers.get("set-cookie")!);

    defaultHeaders.cookie = `ssid=${cookies["ssid"]}`;

    const getSelfResponse = await client.getSelf();

    assert.equal(getSelfResponse.status, 200);
  });

  it("should fail with an invalid username", async () => {
    const client = new AdminClient(ctx.baseUrl);
    const res = await client.logIn({
      username: "invalid",
      password: "abc123",
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.message, "invalid credentials");
  });

  it("should fail with an invalid password", async () => {
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

    const client = new AdminClient(ctx.baseUrl);
    const res = await client.logIn({
      username,
      password: "invalid",
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.message, "invalid credentials");
  });
});
