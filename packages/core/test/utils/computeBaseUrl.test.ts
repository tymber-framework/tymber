import { describe, it } from "node:test";
import * as assert from "node:assert";
import { computeBaseUrl } from "../../src/utils/computeBaseUrl.js";

describe("computeBaseUrl", () => {
  it("should use the 'forwarded' header if applicable", () => {
    const headers = new Headers({
      forwarded: 'for="1.2.3.4";host="example.com";proto="https";by="5.6.7.8"',
    });
    assert.equal(computeBaseUrl(headers), "https://example.com");
  });

  it("should use the 'x-forwarded' headers if applicable", () => {
    const headers = new Headers({
      "x-forwarded-proto": "https",
      "x-forwarded-host": "example.com",
    });
    assert.equal(computeBaseUrl(headers), "https://example.com");
  });

  it("should use the 'Host' header by default", () => {
    const headers = new Headers({
      host: "example.com",
    });
    assert.equal(computeBaseUrl(headers), "http://example.com");
  });
});
