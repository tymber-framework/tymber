import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { setup, type TestContext } from "../setup.js";
import { MailService } from "../../src";
import { emptyContext, sleep } from "@tymber/core";
import { MailRepository } from "../../src/repositories/MailRepository";

describe("MailService", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    const mailService = ctx.getInstance(MailService);

    const res = await mailService.queue(emptyContext(), {
      from: {
        email: "noreply@example.com",
      },
      to: [
        {
          email: "test1@example.com",
        },
      ],
      subject: "Test",
      body: "Test",
    });

    assert.ok(res.ok);

    await sleep(100);

    const mailRepository = ctx.getInstance(MailRepository);
    const mail = await mailRepository.findById(emptyContext(), res.value);

    assert.partialDeepStrictEqual(mail, {
      status: 2,
      error: null,
      subject: "Test",
      externalId: "abc123",
    });
  });
});
