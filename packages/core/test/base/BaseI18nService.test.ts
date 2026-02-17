import { describe, it } from "node:test";
import * as assert from "node:assert";
import { emptyContext, ModuleDefinitions } from "../../src/";
import { BaseI18nService } from "../../src/I18nService";
import { Locale } from "../../src/contrib/accept-language-parser";

describe("BaseI18nService", () => {
  it("should work", () => {
    const ctx = emptyContext();
    const en = "en" as Locale;
    const fr = "fr" as Locale;
    const es = "es" as Locale;
    const i18n = new BaseI18nService(new ModuleDefinitions([]));

    // @ts-expect-error private property
    i18n.translations.set(
      "en",
      new Map([
        ["hello", "hello"],
        ["template", "hello <%= value %>"],
      ]),
    );

    // @ts-expect-error private property
    i18n.translations.set("fr", new Map([["hello", "bonjour"]]));

    assert.equal(i18n.translate(ctx, en, "hello"), "hello");
    assert.equal(i18n.translate(ctx, en, "missing"), "");
    assert.equal(
      i18n.translate(ctx, en, "template", {
        value: "world",
      }),
      "hello world",
    );
    assert.equal(i18n.translate(ctx, en, "template"), "");

    assert.equal(i18n.translate(ctx, fr, "hello"), "bonjour");
    assert.equal(i18n.translate(ctx, fr, "template"), "");

    assert.equal(i18n.translate(ctx, es, "hello"), "");
  });
});
