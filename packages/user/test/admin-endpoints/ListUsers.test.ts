import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { setup, type TestContext } from "../setup.js";

describe("ListUsers", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work with default values", async () => {
    const res = await ctx.adminClient.listUsers();

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 3);

    assert.deepEqual(res.body.items[0], {
      id: ctx.userIds[2],
      firstName: "CAROL",
      lastName: "DOE",
      email: "carol.doe@example.com",
    });
  });

  it("should work with search", async () => {
    const res = await ctx.adminClient.listUsers({
      q: "Jo",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);
  });

  it("should work with sorting", async () => {
    const res = await ctx.adminClient.listUsers({
      sort: "last_name:desc",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 3);

    const lastNames = res.body.items.map((u) => u.lastName);
    assert.deepEqual(lastNames, ["Smith", "johnson", "DOE"]);
  });
});
