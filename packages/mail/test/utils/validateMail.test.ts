import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { validateMail } from "../../src/utils/validateMail.js";

describe("validateMail", () => {
  it("should return true for a valid mail with 'to'", () => {
    const mail = {
      from: { email: "sender@example.com" },
      to: [{ email: "recipient@example.com" }],
      subject: "Hello",
      body: "World",
    };
    assert.strictEqual(validateMail(mail), true);
  });

  it("should return true for a valid mail with 'cc'", () => {
    const mail = {
      from: { email: "sender@example.com" },
      cc: [{ email: "cc@example.com" }],
      subject: "Hello",
      body: "World",
    };
    assert.strictEqual(validateMail(mail), true);
  });

  it("should return true for a valid mail with 'bcc'", () => {
    const mail = {
      from: { email: "sender@example.com" },
      bcc: [{ email: "bcc@example.com" }],
      subject: "Hello",
      body: "World",
    };
    assert.strictEqual(validateMail(mail), true);
  });

  it("should return false if all recipients are missing", () => {
    const mail = {
      from: { email: "sender@example.com" },
      subject: "Hello",
      body: "World",
    };
    assert.strictEqual(validateMail(mail), false);
    assert.ok(validateMail.errors?.some((e) => e.keyword === "anyOf"));
  });

  it("should return false if 'to' is an empty array", () => {
    const mail = {
      from: { email: "sender@example.com" },
      to: [],
      subject: "Hello",
      body: "World",
    };
    assert.strictEqual(validateMail(mail), false);
    assert.ok(validateMail.errors?.some((e) => e.keyword === "minItems"));
  });

  it("should return false if 'from' email is invalid", () => {
    const mail = {
      from: { email: "invalid-email" },
      to: [{ email: "recipient@example.com" }],
      subject: "Hello",
      body: "World",
    };
    assert.strictEqual(validateMail(mail), false);
    assert.ok(validateMail.errors?.some((e) => e.params.format === "email"));
  });

  it("should return false if 'to' email is invalid", () => {
    const mail = {
      from: { email: "sender@example.com" },
      to: [{ email: "invalid-email" }],
      subject: "Hello",
      body: "World",
    };
    assert.strictEqual(validateMail(mail), false);
    assert.ok(validateMail.errors?.some((e) => e.params.format === "email"));
  });

  it("should return false if subject is missing", () => {
    const mail = {
      from: { email: "sender@example.com" },
      to: [{ email: "recipient@example.com" }],
      body: "World",
    };
    assert.strictEqual(validateMail(mail), false);
    assert.ok(
      validateMail.errors?.some((e) => e.params.missingProperty === "subject"),
    );
  });

  it("should return false if body is missing", () => {
    const mail = {
      from: { email: "sender@example.com" },
      to: [{ email: "recipient@example.com" }],
      subject: "Hello",
    };
    assert.strictEqual(validateMail(mail), false);
    assert.ok(
      validateMail.errors?.some((e) => e.params.missingProperty === "body"),
    );
  });

  it("should return true with attachments", () => {
    const mail = {
      from: { email: "sender@example.com" },
      to: [{ email: "recipient@example.com" }],
      subject: "Hello",
      body: "World",
      attachments: [
        {
          contentType: "text/plain",
          filename: "test.txt",
          content: new Uint8Array([1, 2, 3]),
        },
      ],
    };
    assert.strictEqual(validateMail(mail), true);
  });
});
