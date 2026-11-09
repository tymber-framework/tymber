import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { setup, type TestContext } from "../setup.js";
import { DBLogService } from "../../src/services/DBLogService.js";

describe("ListLogComponents", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();

    const logService = ctx.getInstance(DBLogService);

    logService.for("test-component-1");
    logService.for("test-component-2");
    logService.for("test-component-1"); // Duplicate, should only appear once
  });

  after(() => ctx.close());

  it("should work", async () => {
    const res = await ctx.adminClient.listLogComponents();

    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.items.sort(),
      ["test-component-1", "test-component-2"].sort(),
    );
  });
});
