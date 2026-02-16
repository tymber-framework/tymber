import { type Locale } from "./contrib/accept-language-parser.js";
import { ModuleDefinitions } from "./Module.js";
import { compileTemplate } from "./contrib/template.js";
import { Component, INJECT } from "./Component.js";
import type { Context } from "./Context.js";
import { FS } from "./utils/fs.js";

function flatten(obj: any) {
  const output: Record<string, string> = {};

  function flattenRecursively(curr: any, parentKey: string) {
    if (typeof curr === "object" && curr !== null && !Array.isArray(curr)) {
      for (const key in curr) {
        flattenRecursively(curr[key], parentKey ? `${parentKey}.${key}` : key);
      }
    } else {
      output[parentKey] = curr;
    }
  }

  flattenRecursively(obj, "");
  return output;
}

export abstract class I18nService extends Component {
  public abstract availableLocales(): Locale[];
  public abstract translate(
    ctx: Context,
    locale: Locale,
    key: string,
    ...args: any[]
  ): string;
}

export class BaseI18nService extends I18nService {
  static [INJECT] = [ModuleDefinitions];

  private readonly translations = new Map<string, Map<string, string>>();

  constructor(private readonly modules: ModuleDefinitions) {
    super();
  }

  override init() {
    return this.loadTranslations();
  }

  private async loadTranslations() {
    try {
      for (const module of this.modules.modules) {
        if (!module.assetsDir) {
          continue;
        }
        for (const filename of await FS.readDirRecursively(
          FS.join(module.assetsDir, "i18n"),
        )) {
          if (!filename.endsWith(".json")) {
            continue;
          }
          const content = await FS.readFile(
            FS.join(module.assetsDir, "i18n", filename),
          );
          const locale = filename.slice(0, -5);
          const values = JSON.parse(content);

          let localizedTranslations = this.translations.get(locale);
          if (!localizedTranslations) {
            this.translations.set(locale, (localizedTranslations = new Map()));
          }
          const flatTranslations = flatten(values);
          for (const [key, value] of Object.entries(flatTranslations)) {
            localizedTranslations.set(key, value);
          }
        }
      }
    } catch (e) {}
  }

  override availableLocales() {
    return Array.from(this.translations.keys()) as Locale[];
  }

  override translate(
    _ctx: Context,
    locale: Locale,
    key: string,
    ...args: any[]
  ) {
    const value = this.translations.get(locale)?.get(key);
    if (value && value.includes("<%")) {
      return compileTemplate(value)(args);
    } else {
      return value || "";
    }
  }
}
