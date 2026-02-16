import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";
import { AdminClient } from "@tymber/client";
import { emptyContext, sql } from "@tymber/common";

describe("Init", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    const initCtx = emptyContext();
    await ctx.db.query(initCtx, sql.deleteFrom("t_misc"));
    await ctx.db.query(initCtx, sql.deleteFrom("t_admin_sessions"));
    await ctx.db.query(initCtx, sql.deleteFrom("t_admin_users"));

    const client = new AdminClient(ctx.baseUrl);

    const res = await client.init({
      applicationName: "test",
      environmentName: "dev",
      environmentColorHex: "#FF0000",
      username: "admin",
      password: "abc12345",
    });

    assert.equal(res.status, 204);

    const reinitResponse = await client.init({
      applicationName: "test",
      environmentName: "dev",
      environmentColorHex: "#00FF00",
      username: "admin2",
      password: "abc12345",
    });

    assert.equal(reinitResponse.status, 400);
  });
});
