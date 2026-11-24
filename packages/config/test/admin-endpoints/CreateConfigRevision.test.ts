import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, TestContext } from "../setup";

describe("CreateConfigRevision", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    const res = await ctx.adminClient.createConfigRevision({
      values: {
        CORS_ALLOW_ORIGINS: ["https://example.com"],
      },
      comment: "hello",
    });

    assert.equal(res.status, 200);
  });

  it("should fail with an invalid config", async () => {
    const res = await ctx.adminClient.createConfigRevision({
      values: {
        ADMIN_COOKIE_SAME_SITE_ATTRIBUTE: "invalid",
      },
      comment: "hello",
    });

    assert.equal(res.status, 400);
  });
});
