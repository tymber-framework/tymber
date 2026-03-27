import { describe, it } from "node:test";
import * as assert from "node:assert";
import { encryptValue } from "../../src/utils/encryptValue";
import { decryptValue } from "../../src/utils/decryptValue";

describe("encryptValue", () => {
  it("should work", () => {
    const encrypted = encryptValue("hello", "MyS3cr3t");
    const decrypted = decryptValue(encrypted, "MyS3cr3t");

    assert.equal(decrypted, "hello");
  });

  it("should fail with the wrong secret", () => {
    const encrypted = encryptValue("hello", "MyS3cr3t");

    try {
      decryptValue(encrypted, "wrong secret");
      assert.fail();
    } catch (e) {}
  });
});
