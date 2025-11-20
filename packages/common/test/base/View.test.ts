import { after, before, describe, it } from "node:test";
import * as assert from "node:assert";
import {
  BaseTestContext,
  createTestApp,
  type HttpContext,
  View,
} from "../../src";
import { Client } from "@tymber/client";
import { join } from "node:path";
import handlebars from "handlebars";
import { readFile } from "node:fs/promises";
import { createTestDB } from "../setup";
import { FileBasedTemplateService } from "../../src/TemplateService";

class HandlebarsTemplateService extends FileBasedTemplateService {
  override fileExtension = ".hbs";

  async render(templateName: string, data: Record<string, any>) {
    const absolutePath = this.templates.get(templateName)!;
    const content = await readFile(absolutePath, "utf8");

    return handlebars.compile(content)(data);
  }
}

describe("View", () => {
  let ctx: BaseTestContext;

  before(async () => {
    ctx = await createTestApp(
      () => createTestDB(),
      [
        {
          name: "test",
          assetsDir: join(import.meta.dirname, "test-module", "assets"),

          init(app) {
            app.component(HandlebarsTemplateService);

            app.view(
              "/",
              class extends View {
                override allowAnonymous = true;

                override handle(ctx: HttpContext) {
                  return ctx.render("layout", "view", {
                    value: "hello",
                  });
                }
              },
            );

            app.view(
              "/no-layout",
              class extends View {
                override allowAnonymous = true;

                override handle(ctx: HttpContext) {
                  return ctx.render(null, "view", {
                    value: "hello",
                  });
                }
              },
            );

            app.view(
              "/localized",
              class extends View {
                override allowAnonymous = true;

                override handle(ctx: HttpContext) {
                  return ctx.render(null, "localized-view");
                }
              },
            );

            app.view(
              "/hbs",
              class extends View {
                override allowAnonymous = true;

                override handle(ctx: HttpContext) {
                  return ctx.render("custom-layout", "custom-view", {
                    value: "hello",
                  });
                }
              },
            );
          },
        },
      ],
    );
  });

  after(() => {
    return ctx.close();
  });

  it("should return an HTML view", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({
      method: "GET",
      path: "/",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body, '<div id="layout">hello\n</div>\n');
  });

  it("should return an HTML view (without layout)", async () => {
    const res = await new Client(ctx.baseUrl).fetch({
      method: "GET",
      path: "/no-layout",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body, "hello\n");
  });

  it("should use the default locale", async () => {
    const res = await new Client(ctx.baseUrl).fetch({
      method: "GET",
      path: "/localized",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body, "Hello world!\n");
  });

  it("should use the preferred locale", async () => {
    const res = await new Client(ctx.baseUrl).fetch({
      method: "GET",
      path: "/localized",
      headers: {
        "accept-language": "es,fr;q=0.8,en;q=0.6",
      },
    });

    assert.equal(res.body, "Bonjour monde !\n");
  });

  it("should use the custom TemplateService", async () => {
    const client = new Client(ctx.baseUrl);
    const res = await client.fetch({
      method: "GET",
      path: "/hbs",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body, '<div id="hbs-layout">hello</div>');
  });
});
