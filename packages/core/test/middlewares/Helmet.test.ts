import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import { Client } from "@tymber/client";
import { createTestDB } from "../setup.js";
import {
  Helmet,
  BaseTestContext,
  ConfigService,
  createTestApp,
  Endpoint,
} from "../../src";

describe("Helmet", () => {
  let ctx: BaseTestContext;

  before(async () => {
    ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "helmet-test",
          version: "0.0.1",
          init(app) {
            app.middleware(Helmet);

            // Custom ConfigService that provides empty values
            // The schema defaults will be used
            app.component(
              class extends ConfigService {
                protected getCurrentValues() {
                  // Return empty object - defaults from schema will be used
                  return Promise.resolve({});
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

  after(async () => {
    ctx.close();
  });

  it("should remove x-powered-by header by default (hidePoweredBy)", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({ method: "GET", path: "/test" });
    assert.equal(res.status, 200);
    assert.equal(res.headers.has("x-powered-by"), false);
  });

  it("should set x-frame-options to SAMEORIGIN by default (frameguard)", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({ method: "GET", path: "/test" });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-frame-options"), "SAMEORIGIN");
  });

  it("should set x-content-type-options to nosniff by default (noSniff)", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({ method: "GET", path: "/test" });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  });

  it("should set x-download-options to noopen by default (ieNoOpen)", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({ method: "GET", path: "/test" });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-download-options"), "noopen");
  });

  it("should set x-dns-prefetch-control to off by default", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({ method: "GET", path: "/test" });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-dns-prefetch-control"), "off");
  });

  it("should set referrer-policy to no-referrer by default", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({ method: "GET", path: "/test" });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("referrer-policy"), "no-referrer");
  });

  it("should set x-permitted-cross-domain-policies to none by default", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({ method: "GET", path: "/test" });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-permitted-cross-domain-policies"), "none");
  });

  it("should NOT set cross-origin-embedder-policy by default (disabled)", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({ method: "GET", path: "/test" });
    assert.equal(res.status, 200);
    assert.equal(res.headers.has("cross-origin-embedder-policy"), false);
  });

  it("should set cross-origin-opener-policy to same-origin by default", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({ method: "GET", path: "/test" });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cross-origin-opener-policy"), "same-origin");
  });

  it("should set cross-origin-resource-policy to same-origin by default", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({ method: "GET", path: "/test" });
    assert.equal(res.status, 200);
    assert.equal(
      res.headers.get("cross-origin-resource-policy"),
      "same-origin",
    );
  });

  it("should set strict-transport-security by default (HSTS)", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({ method: "GET", path: "/test" });
    assert.equal(res.status, 200);
    const hsts = res.headers.get("strict-transport-security");
    assert.ok(hsts);
    assert.ok(hsts!.includes("max-age=31536000"));
    assert.ok(hsts!.includes("includeSubDomains"));
    assert.ok(!hsts!.includes("preload"));
  });

  it("should set content-security-policy by default with all directives", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({ method: "GET", path: "/test" });
    assert.equal(res.status, 200);
    const csp = res.headers.get("content-security-policy");
    assert.ok(csp);

    // Check all default directives are present
    assert.ok(csp!.includes("default-src 'self'"));
    assert.ok(csp!.includes("base-uri 'self'"));
    assert.ok(csp!.includes("font-src 'self' https: data:"));
    assert.ok(csp!.includes("form-action 'self'"));
    assert.ok(csp!.includes("frame-ancestors 'self'"));
    assert.ok(csp!.includes("img-src 'self' data:"));
    assert.ok(csp!.includes("object-src 'none'"));
    assert.ok(csp!.includes("script-src 'self'"));
    assert.ok(csp!.includes("script-src-attr 'none'"));
    assert.ok(csp!.includes("style-src 'self' https: 'unsafe-inline'"));
    assert.ok(csp!.includes("upgrade-insecure-requests"));
  });

  it("should set x-xss-protection to 0 by default", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({ method: "GET", path: "/test" });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-xss-protection"), "0");
  });

  it("should set origin-agent-cluster to ?1 by default", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({ method: "GET", path: "/test" });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("origin-agent-cluster"), "?1");
  });

  describe("with custom CSP configuration", () => {
    let customCtx: BaseTestContext;

    before(async () => {
      customCtx = await createTestApp(
        () => createTestDB(),
        [
          {
            name: "helmet-custom-csp",
            version: "0.0.1",
            init(app) {
              app.middleware(Helmet);

              app.component(
                class extends ConfigService {
                  protected getCurrentValues() {
                    return Promise.resolve({
                      HELMET_CSP_DEFAULT_SRC: [
                        "'self'",
                        "https://cdn.example.com",
                      ],
                      HELMET_CSP_SCRIPT_SRC: [
                        "'self'",
                        "https://cdn.example.com",
                      ],
                      HELMET_CSP_STYLE_SRC: ["'self'", "'unsafe-inline'"],
                      HELMET_CSP_UPGRADE_INSECURE_REQUESTS: false,
                    });
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

    after(async () => {
      await customCtx.close();
    });

    it("should use custom CSP directives", async () => {
      const client = new Client(customCtx.baseUrl);
      const res = await client.fetch({ method: "GET", path: "/test" });
      assert.equal(res.status, 200);
      const csp = res.headers.get("content-security-policy");
      assert.ok(csp);

      assert.ok(csp!.includes("default-src 'self' https://cdn.example.com"));
      assert.ok(csp!.includes("script-src 'self' https://cdn.example.com"));
      assert.ok(csp!.includes("style-src 'self' 'unsafe-inline'"));
      // upgrade-insecure-requests should not be present
      assert.ok(!csp!.includes("upgrade-insecure-requests"));
    });
  });

  describe("with disabled features", () => {
    let disabledCtx: BaseTestContext;

    before(async () => {
      disabledCtx = await createTestApp(
        () => createTestDB(),
        [
          {
            name: "helmet-disabled",
            version: "0.0.1",
            init(app) {
              app.middleware(Helmet);

              app.component(
                class extends ConfigService {
                  protected getCurrentValues() {
                    return Promise.resolve({
                      HELMET_CONTENT_SECURITY_POLICY_ENABLED: false,
                      HELMET_HSTS_ENABLED: false,
                      HELMET_HIDE_POWERED_BY_ENABLED: false,
                      HELMET_FRAME_OPTIONS_ENABLED: false,
                      HELMET_NOSNIFF_ENABLED: false,
                      HELMET_XSS_FILTER_ENABLED: false,
                      HELMET_CROSS_ORIGIN_EMBEDDER_POLICY_ENABLED: true,
                      HELMET_CROSS_ORIGIN_EMBEDDER_POLICY: "credentialless",
                    });
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

    after(async () => {
      await disabledCtx.close();
    });

    it("should not set headers for disabled features", async () => {
      const client = new Client(disabledCtx.baseUrl);
      const res = await client.fetch({ method: "GET", path: "/test" });
      assert.equal(res.status, 200);

      // These should NOT be set
      assert.equal(res.headers.has("content-security-policy"), false);
      assert.equal(res.headers.has("strict-transport-security"), false);
      assert.equal(res.headers.has("x-frame-options"), false);
      assert.equal(res.headers.has("x-content-type-options"), false);
      assert.equal(res.headers.has("x-xss-protection"), false);

      // This should be set (enabled via config)
      assert.equal(
        res.headers.get("cross-origin-embedder-policy"),
        "credentialless",
      );
    });

    it("should still set enabled-by-default headers", async () => {
      const client = new Client(disabledCtx.baseUrl);
      const res = await client.fetch({ method: "GET", path: "/test" });
      assert.equal(res.status, 200);

      // These are still enabled by default
      assert.equal(res.headers.get("x-dns-prefetch-control"), "off");
      assert.equal(res.headers.get("referrer-policy"), "no-referrer");
      assert.equal(
        res.headers.get("cross-origin-opener-policy"),
        "same-origin",
      );
      assert.equal(
        res.headers.get("cross-origin-resource-policy"),
        "same-origin",
      );
    });
  });
});
