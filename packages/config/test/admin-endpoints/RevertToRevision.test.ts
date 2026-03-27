import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { setup, TestContext } from "../setup";
import { emptyContext, sql } from "@tymber/core";

describe("RevertToRevision", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    const res = await ctx.adminClient.createConfigRevision({
      values: {
        CORS_ALLOW_ORIGINS: ["https://1.test"],
      },
      comment: "hello",
    });

    const revisionId = res.body.id;

    await ctx.adminClient.createConfigRevision({
      values: {
        CORS_ALLOW_ORIGINS: ["https://2.test"],
      },
      comment: "hello",
    });

    const revertResponse = await ctx.adminClient.revertToRevision(revisionId, {
      comment: "hello",
    });

    assert.equal(revertResponse.status, 200);
  });

  it("should fail with an unknown revision ID", async () => {
    const res = await ctx.adminClient.revertToRevision(123, {
      comment: "hello",
    });

    assert.equal(res.status, 400);
  });

  it("should fail to revert to the current revision", async () => {
    const res = await ctx.adminClient.createConfigRevision({
      values: {
        CORS_ALLOW_ORIGINS: ["https://1.test"],
      },
      comment: "hello",
    });

    const revisionId = res.body.id;

    const revertResponse = await ctx.adminClient.revertToRevision(revisionId, {
      comment: "hello",
    });

    assert.equal(revertResponse.status, 400);
  });
});
