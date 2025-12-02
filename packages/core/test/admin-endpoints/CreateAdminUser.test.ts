import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { randomUUID } from "node:crypto";
import { AdminClient } from "@tymber/client";

describe("CreateAdminUser", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    const username = randomUUID();

    const res = await ctx.adminClient.createAdminUser({
      username,
      password: "changeit",
    });

    assert.equal(res.status, 204);
  });

  it("should fail with a duplicate username", async () => {
    const res = await ctx.adminClient.createAdminUser({
      username: "admin",
      password: "changeit",
    });

    assert.equal(res.status, 400);
  });

  it("should fail with an anonymous user", async () => {
    const client = new AdminClient(ctx.baseUrl);
    const res = await client.createAdminUser({
      username: randomUUID(),
      password: "changeit",
    });

    assert.equal(res.status, 401);
  });
});
