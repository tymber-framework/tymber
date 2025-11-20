import { describe, it } from "node:test";
import * as assert from "node:assert";
import { escapeValue } from "../../src/utils/escapeValue.js";

describe("escapeValue", () => {
  it("should escape ~ characters", () => {
    const input = "test~value";
    const output = escapeValue(input);
    assert.strictEqual(output, "test~~value");
  });

  it("should escape % characters", () => {
    const input = "test%value";
    const output = escapeValue(input);
    assert.strictEqual(output, "test~%value");
  });

  it("should escape _ characters", () => {
    const input = "test_value";
    const output = escapeValue(input);
    assert.strictEqual(output, "test~_value");
  });

  it("should escape multiple special characters", () => {
    const input = "test~%_value";
    const output = escapeValue(input);
    assert.strictEqual(output, "test~~~%~_value");
  });

  it("should return the original string if no escapable characters are present", () => {
    const input = "testvalue";
    const output = escapeValue(input);
    assert.strictEqual(output, "testvalue");
  });

  it("should handle an empty string", () => {
    const input = "";
    const output = escapeValue(input);
    assert.strictEqual(output, "");
  });
});
