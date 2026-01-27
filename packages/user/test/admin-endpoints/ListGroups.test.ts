import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { setup, type TestContext } from "../setup.js";

describe("ListGroups", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work with default values", async () => {
    const res = await ctx.adminClient.listGroups();

    assert.equal(res.status, 200);

    assert.deepEqual(res.body.items, [
      {
        id: ctx.groupIds[0],
        label: "AAA",
      },
      {
        id: ctx.groupIds[1],
        label: "bbb",
      },
    ]);
  });

  it("should work with search", async () => {
    const res = await ctx.adminClient.listGroups({
      q: "a",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);
  });

  it("should work with sorting", async () => {
    const res = await ctx.adminClient.listGroups({
      sort: "label:desc",
    });

    assert.equal(res.status, 200);

    const labels = res.body.items.map((g) => g.label);

    assert.deepEqual(labels, ["bbb", "AAA"]);
  });
});
