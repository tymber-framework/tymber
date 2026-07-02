import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { emptyContext, sql, type GroupRole, type UserRole } from "@tymber/core";
import { AdminClient } from "@tymber/client";

describe("ListAdminAuditLogs", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
    ctx.userRoleRegistry.add(1 as UserRole);
    ctx.groupRoleRegistry.add(0 as GroupRole);

    await ctx.db.run(emptyContext(), sql.deleteFrom("t_admin_audit_logs"));

    await ctx.adminClient.impersonateUser(ctx.userIds[0]);
    await ctx.adminClient.addUserToGroup(ctx.userIds[0], ctx.groupIds[1], 0);
    await ctx.adminClient.removeUserFromGroup(ctx.userIds[0], ctx.groupIds[1]);
    await ctx.adminClient.updateUserRole(ctx.userIds[1], 1);
  });

  after(() => ctx.close());

  it("should work", async () => {
    const adminClient = new AdminClient(ctx.baseUrl, {
      cookie: `ssid=${ctx.adminSessionId}`,
    });
    const res = await adminClient.listAdminAuditLogs();

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 4);

    assert.partialDeepStrictEqual(res.body.items[0], {
      createdBy: {
        id: ctx.adminUserId,
        username: "admin",
      },
      action: "UPDATE_USER_ROLE",
      description: `The role of user <a href="${ctx.baseUrl}/admin/users/${ctx.userIds[1]}">bob johnson</a> has been updated to <b>manager</b>`,
    });

    assert.partialDeepStrictEqual(res.body.items[1], {
      createdBy: {
        id: ctx.adminUserId,
        username: "admin",
      },
      action: "REMOVE_USER_FROM_GROUP",
      description: `User <a href="${ctx.baseUrl}/admin/users/${ctx.userIds[0]}">Alice Smith</a> has been removed from group <a href="${ctx.baseUrl}/admin/groups/${ctx.groupIds[1]}">bbb</a>`,
    });

    assert.partialDeepStrictEqual(res.body.items[2], {
      createdBy: {
        id: ctx.adminUserId,
        username: "admin",
      },
      action: "ADD_USER_TO_GROUP",
      description: `User <a href="${ctx.baseUrl}/admin/users/${ctx.userIds[0]}">Alice Smith</a> has been added to group <a href="${ctx.baseUrl}/admin/groups/${ctx.groupIds[1]}">bbb</a> with role <b>analyst</b>`,
    });

    assert.partialDeepStrictEqual(res.body.items[3], {
      createdBy: {
        id: ctx.adminUserId,
        username: "admin",
      },
      action: "IMPERSONATE_USER",
      description: `The impersonation of user <a href="${ctx.baseUrl}/admin/users/${ctx.userIds[0]}">Alice Smith</a> has started`,
    });
  });
});
