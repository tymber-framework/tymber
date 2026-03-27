import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { emptyContext, sql } from "@tymber/core";
import { AdminClient } from "@tymber/client";

describe("ListAdminAuditLogs", () => {
  let ctx: TestContext;
  let revisionIds: number[] = [];

  before(async () => {
    ctx = await setup();

    await ctx.db.run(emptyContext(), sql.deleteFrom("t_admin_audit_logs"));

    let res = await ctx.adminClient.createConfigRevision({
      values: {
        CORS_ALLOW_ORIGINS: ["https://domain1.test"],
      },
      comment: "test1",
    });

    revisionIds.push(res.body.id);

    res = await ctx.adminClient.createConfigRevision({
      values: {
        CORS_ALLOW_ORIGINS: ["https://domain2.test"],
      },
      comment: "test2",
    });

    revisionIds.push(res.body.id);

    res = await ctx.adminClient.revertToRevision(revisionIds[0], {
      comment: "test3",
    });

    revisionIds.push(res.body.id);
  });

  after(() => ctx.close());

  it("should work", async () => {
    const adminClient = new AdminClient(ctx.baseUrl, {
      cookie: `ssid=${ctx.adminSessionId}`,
    });
    const res = await adminClient.listAdminAuditLogs();

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 3);

    assert.partialDeepStrictEqual(res.body.items[0], {
      createdBy: {
        id: ctx.adminUserId,
        username: "admin",
      },
      action: "REVERT_CONFIG_REVISION",
      description: `Config revision <b>#${revisionIds[0]}</b> was reverted`,
    });

    assert.partialDeepStrictEqual(res.body.items[1], {
      createdBy: {
        id: ctx.adminUserId,
        username: "admin",
      },
      action: "CREATE_CONFIG_REVISION",
      description: `Config revision <b>#${revisionIds[1]}</b> was created`,
    });

    assert.partialDeepStrictEqual(res.body.items[2], {
      createdBy: {
        id: ctx.adminUserId,
        username: "admin",
      },
      action: "CREATE_CONFIG_REVISION",
      description: `Config revision <b>#${revisionIds[0]}</b> was created`,
    });
  });
});
