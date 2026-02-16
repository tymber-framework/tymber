import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { setup, TestContext } from "../setup";
import { parseCookieHeader } from "@tymber/core";
import { UserAdminClient } from "@tymber/client";
import { randomUUID } from "node:crypto";

describe("ImpersonateUser", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    const headers = {
      cookie: `ssid=${ctx.adminSessionId}`,
    };
    const adminClient = new UserAdminClient(ctx.baseUrl, headers);

    const res = await adminClient.impersonateUser(ctx.userIds[0]);

    assert.equal(res.status, 204);

    const cookies = parseCookieHeader(res.headers.get("set-cookie")!);

    headers.cookie = `ssid=${ctx.adminSessionId}; sid=${cookies["sid"]};`;

    const getSelfRes = await adminClient.fetch({
      method: "GET",
      path: "/api/self",
    });

    assert.equal(getSelfRes.status, 200);
    assert.equal(getSelfRes.body.id, ctx.userIds[0]);
  });

  it("should fail with an invalid user ID", async () => {
    const res = await ctx.adminClient.impersonateUser(randomUUID());

    assert.equal(res.status, 400);
  });
});
