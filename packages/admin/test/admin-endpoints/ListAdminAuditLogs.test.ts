import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import {
  AdminUserId,
  emptyContext,
  parseCookieHeader,
  sql,
} from "@tymber/core";
import { AdminClient } from "@tymber/client";

describe("ListAdminAuditLogs", () => {
  let ctx: TestContext;
  let testAdminId: AdminUserId;

  before(async () => {
    ctx = await setup();

    await ctx.db.run(emptyContext(), sql.deleteFrom("t_admin_audit_logs"));

    await ctx.adminClient.createAdminUser({
      username: "test",
      password: "changeit",
    });

    const defaultHeaders = {
      cookie: "",
    };

    const newClient = new AdminClient(ctx.baseUrl, defaultHeaders);

    const res = await newClient.logIn({
      username: "test",
      password: "changeit",
    });

    defaultHeaders.cookie = `ssid=${parseCookieHeader(res.headers.get("set-cookie")!)["ssid"]}`;

    const selfRes = await newClient.getSelf();
    testAdminId = selfRes.body.id as AdminUserId;

    await newClient.initPassword({
      password: "abc12345",
    });

    await newClient.runAdminQuery({
      query: "SELECT 1;",
      comment: "test",
    });
  });

  after(() => ctx.close());

  it("should work", async () => {
    const res = await ctx.adminClient.listAdminAuditLogs();

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 4);

    assert.partialDeepStrictEqual(res.body.items[0], {
      createdBy: {
        id: testAdminId,
        username: "test",
      },
      action: "RUN_ADMIN_QUERY",
      description: "Run admin query <b>#1</b>: <b>1</b> affected row(s)",
    });

    assert.partialDeepStrictEqual(res.body.items[1], {
      createdBy: {
        id: testAdminId,
        username: "test",
      },
      action: "INIT_PASSWORD",
      description: "Init password",
    });

    assert.partialDeepStrictEqual(res.body.items[2], {
      createdBy: {
        id: testAdminId,
        username: "test",
      },
      action: "LOG_IN",
      description: "Log in",
    });

    assert.partialDeepStrictEqual(res.body.items[3], {
      createdBy: {
        id: ctx.adminUserId,
        username: "admin",
      },
      action: "CREATE_ADMIN_USER",
      description: "Create admin user <b>test</b>",
    });

    assert.partialDeepStrictEqual(res.body.items[3], {
      createdBy: {
        id: ctx.adminUserId,
        username: "admin",
      },
      action: "CREATE_ADMIN_USER",
      description: "Create admin user <b>test</b>",
    });
  });

  it("should work (sort)", async () => {
    const res = await ctx.adminClient.listAdminAuditLogs({
      sort: "created_at:asc",
      size: 1,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);

    assert.partialDeepStrictEqual(res.body.items[0], {
      createdBy: {
        id: ctx.adminUserId,
        username: "admin",
      },
      action: "CREATE_ADMIN_USER",
      description: "Create admin user <b>test</b>",
    });
  });

  it("should work (filter by action)", async () => {
    const res = await ctx.adminClient.listAdminAuditLogs({
      action: "LOG_IN",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);

    assert.partialDeepStrictEqual(res.body.items[0], {
      createdBy: {
        id: testAdminId,
        username: "test",
      },
      action: "LOG_IN",
      description: "Log in",
    });
  });

  it("should work (filter by user)", async () => {
    const res = await ctx.adminClient.listAdminAuditLogs({
      createdBy: ctx.adminUserId,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);

    assert.partialDeepStrictEqual(res.body.items[0], {
      createdBy: {
        id: ctx.adminUserId,
        username: "admin",
      },
      action: "CREATE_ADMIN_USER",
      description: "Create admin user <b>test</b>",
    });
  });
});
