import { describe, it } from "node:test";
import * as assert from "node:assert";
import { parseSetCookieHeader } from "../../src/utils/parseSetCookieHeader.js";

describe("parseSetCookieHeader", () => {
  it("should parse simple cookie", () => {
    assert.deepStrictEqual(parseSetCookieHeader("session=abc"), {
      name: "session",
      value: "abc",
    });
  });
});
