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

  it("should work (evaluate + newlines)", () => {
    const t = compileTemplate(`
        <% if (true) { %>1<% } %>
        <% if (false) { %>2<% } %>
        3
        <% if (true) { %>
        4
        <% } %>
        <% if (false) { %>
        5
        <% } %>
        6
        <%= '7' %>
        `);
    assert.equal(
      t({}),
      `1
        3
        4
        6
        7
        `,
    );
  });
});
