import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { createTestDB } from "../setup";
import { CSRF } from "../../src/middlewares/CSRF";
import { BaseTestContext, createTestApp, Endpoint } from "@tymber/core";

describe("CSRF", () => {
  let ctx: BaseTestContext;

  before(async () => {
    ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "test",
          version: "0.0.1",
          init(app) {
            app.middleware(CSRF);

            app.endpoint(
              "POST",
              "/test",
              class extends Endpoint {
                override handle() {
                  return Response.json({ status: "OK" });
                }
              },
            );

            app.endpoint(
              "GET",
              "/test",
              class extends Endpoint {
                override handle() {
                  return Response.json({ status: "OK" });
                }
              },
            );
          },
        },
      ],
    );
  });

  after(() => ctx.close());

  it("should allow same-origin requests (Sec-Fetch-Site)", async () => {
    const res = await fetch(ctx.baseUrl + "/test", {
      method: "POST",
      headers: {
        "sec-fetch-site": "same-origin",
      },
    });
    assert.equal(res.status, 200);
  });

  it("should allow same-site requests (Sec-Fetch-Site)", async () => {
    const res = await fetch(ctx.baseUrl + "/test", {
      method: "POST",
      headers: {
        "sec-fetch-site": "same-site",
      },
    });
    assert.equal(res.status, 200);
  });

  it("should allow same-origin requests (Origin)", async () => {
    const res = await fetch(ctx.baseUrl + "/test", {
      method: "POST",
      headers: {
        origin: ctx.baseUrl,
      },
    });
    assert.equal(res.status, 200);
  });

  it("should allow cross-site GET requests", async () => {
    const res = await fetch(ctx.baseUrl + "/test", {
      method: "GET",
      headers: {
        "sec-fetch-site": "cross-site",
      },
    });
    assert.equal(res.status, 200);
  });

  it("should allow cross-site requests (Sec-Fetch-Site) with CSRF header", async () => {
    const res = await fetch(ctx.baseUrl + "/test", {
      method: "POST",
      headers: {
        "sec-fetch-site": "cross-site",
        "x-csrf-token": "1",
      },
    });
    assert.equal(res.status, 200);
  });

  it("should allow cross-site requests (Origin) with CSRF header", async () => {
    const res = await fetch(ctx.baseUrl + "/test", {
      method: "POST",
      headers: {
        origin: "https://evil-domain.com",
        "x-csrf-token": "1",
      },
    });
    assert.equal(res.status, 200);
  });

  it("should allow non-browser requests (no Origin, no Sec-Fetch-Site) without CSRF header", async () => {
    const res = await fetch(ctx.baseUrl + "/test", {
      method: "POST",
    });
    assert.equal(res.status, 200);
  });

  it("should reject cross-site requests (Sec-Fetch-Site) without CSRF header", async () => {
    const res = await fetch(ctx.baseUrl + "/test", {
      method: "POST",
      headers: {
        "sec-fetch-site": "cross-site",
      },
    });
    assert.equal(res.status, 403);
  });

  it("should reject cross-site requests (Origin) without CSRF header", async () => {
    const res = await fetch(ctx.baseUrl + "/test", {
      method: "POST",
      headers: {
        origin: "https://evil-domain.com",
      },
    });
    assert.equal(res.status, 403);
  });

  it("should reject requests with an invalid origin", async () => {
    const res = await fetch(ctx.baseUrl + "/test", {
      method: "POST",
      headers: {
        origin: "not a valid url",
      },
    });
    assert.equal(res.status, 403);
  });
});
