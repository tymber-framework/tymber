import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { setup, type TestContext } from "../setup.js";
import { emptyContext, sql } from "@tymber/core";

function id(id: number) {
  // BigInts are serialized as strings
  return process.env.USE_SQLITE ? id : String(id);
}

describe("ListMails", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setup();

    await ctx.db.run(
      emptyContext(),
      sql
        .insert()
        .into("t_mails")
        .values([
          {
            id: 1,
            created_at: new Date("2000-01-01T00:00:00.000Z"),
            sent_at: new Date("2000-01-01T00:00:00.000Z"),
            status: 2,
            subject: "Test1",
            error: null,
            external_id: "ext1",
          },
          {
            id: 2,
            created_at: new Date("2000-01-02T00:00:00.000Z"),
            sent_at: null,
            status: 0,
            subject: "Test2",
            external_id: "ext2",
          },
          {
            id: 3,
            created_at: new Date("2000-01-03T00:00:00.000Z"),
            sent_at: null,
            status: 3,
            error: "provider internal error",
            subject: "Test3",
            external_id: "ext3",
          },
        ]),
    );

    await ctx.db.run(
      emptyContext(),
      sql
        .insert()
        .into("t_mail_recipients")
        .values([
          {
            mail_id: 1,
            type: 0,
            email: "test1@example.com",
            name: "Test1",
          },
          {
            mail_id: 1,
            type: 1,
            email: "test2@example.com",
          },
          {
            mail_id: 2,
            type: 2,
            email: "test3@example.com",
          },
        ]),
    );
  });

  after(() => ctx.close());

  it("should work with default values", async () => {
    const res = await ctx.adminClient.listMails();

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.items, [
      {
        id: id(1),
        createdAt: "2000-01-01T00:00:00.000Z",
        sentAt: "2000-01-01T00:00:00.000Z",
        status: 2,
        subject: "Test1",
        externalId: "ext1",
        error: null,
        to: [
          {
            email: "test1@example.com",
            name: "Test1",
          },
        ],
        cc: [
          {
            email: "test2@example.com",
            name: null,
          },
        ],
        bcc: [],
      },
      {
        id: id(2),
        createdAt: "2000-01-02T00:00:00.000Z",
        sentAt: null,
        status: 0,
        error: null,
        subject: "Test2",
        externalId: "ext2",
        to: [],
        cc: [],
        bcc: [
          {
            email: "test3@example.com",
            name: null,
          },
        ],
      },
      {
        id: id(3),
        createdAt: "2000-01-03T00:00:00.000Z",
        sentAt: null,
        status: 3,
        error: "provider internal error",
        subject: "Test3",
        externalId: "ext3",
        to: [],
        cc: [],
        bcc: [],
      },
    ]);
  });

  it("should work with sorting", async () => {
    const res = await ctx.adminClient.listMails({
      sort: "created_at:desc",
    });

    assert.equal(res.status, 200);
    assert.partialDeepStrictEqual(res.body.items, [
      {
        id: id(3),
      },
      {
        id: id(2),
      },
      {
        id: id(1),
      },
    ]);
  });

  it("should work with status filter", async () => {
    const res = await ctx.adminClient.listMails({
      status: 3,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);
    assert.equal(res.body.items[0].id, id(3));
  });

  it("should work with recipient filter", async () => {
    const res = await ctx.adminClient.listMails({
      q: "test3",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);
    assert.equal(res.body.items[0].id, id(2));
  });
});
