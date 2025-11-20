import { describe, it } from "node:test";
import * as assert from "node:assert";
import { createTestApp } from "../../src";
import { Client } from "@tymber/client";
import { join } from "node:path";
import { createTestDB } from "../setup";

describe("StaticEndpoint", () => {
  it("should return a static file", async () => {
    const ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "test",
          assetsDir: join(import.meta.dirname, "test-module", "assets"),

          init(app) {},
        },
      ],
    );

    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({
      method: "GET",
      path: "/static/css/test.css",
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "text/css");
    assert.equal(res.headers.get("cache-control"), "no-cache");
    assert.equal(
      res.body,
      `.test {
  font-size: 42px;
}
`,
    );

    return ctx.close();
  });
});
