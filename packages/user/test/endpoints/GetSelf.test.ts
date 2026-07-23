import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { setup, TestContext } from "../setup";
import { UserClient } from "@tymber/client";
import { randomUUID } from "node:crypto";

describe("GetSelf", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();
  });

  after(() => ctx.close());

  it("should work", async () => {
    const res = await ctx.clients[0].getSelf();

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      id: ctx.externalUserIds[0],
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@smith.com",
      role: {
        id: 1,
        label: "manager",
      },
      groups: [
        {
          id: ctx.externalGroupIds[0],
          label: "AAA",
          role: {
            id: 0,
            label: "analyst",
          },
        },
      ],
    });
  });

  it("should fail without credentials", async () => {
    const client = new UserClient(ctx.baseUrl);
    const res = await client.getSelf();

    assert.equal(res.status, 401);
  });

  it("should fail with an invalid session ID", async () => {
    const client = new UserClient(ctx.baseUrl, {
      cookie: `sid=${randomUUID()}`,
    });
    const res = await client.getSelf();

    assert.equal(res.status, 401);
  });
});
