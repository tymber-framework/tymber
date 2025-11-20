import { describe, it } from "node:test";
import { compileTemplate } from "../../src/contrib/template";
import * as assert from "node:assert";

describe("template", () => {
  it("should work (interpolate)", () => {
    const t = compileTemplate("hello: <%= name %>");
    assert.equal(t({ name: "world" }), "hello: world");
  });

  it("should work (escape)", () => {
    const t = compileTemplate("<b><%- value %></b>");
    assert.equal(t({ value: "<script>" }), "<b>&lt;script&gt;</b>");
  });

  it("should work (evaluate)", () => {
    const t = compileTemplate("<% if (value) { %>value = <%= value %><% } %>");
    assert.equal(t({ value: true }), "value = true");
    assert.equal(t({ value: false }), "");
  });
});
