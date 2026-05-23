<% if (isBunPackageManager) { %>
import { describe, it, beforeAll, afterAll } from "bun:test";
<% } else { %>
import { describe, it, before, after } from "node:test";
<% } %>
import * as assert from "node:assert";
import { setup, type TestContext } from "../setup.js";

describe("HelloWorld", () => {
  let ctx: TestContext;

  before<% if (isBunPackageManager) { %>All<% } %>(async () => {
    ctx = await setup();
  });

  after<% if (isBunPackageManager) { %>All<% } %>(() => ctx.close());

  it("should work", async () => {
    const res = await fetch(`${ctx.baseUrl}/hello`);

    assert.equal(res.status, 200);
  });
});
