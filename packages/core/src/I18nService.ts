import { type Locale } from "./contrib/accept-language-parser.js";
import { ModuleDefinitions } from "./Module.js";
import { compileTemplate } from "./contrib/template.js";
import { Component, INJECT } from "./Component.js";
import type { Context } from "./Context.js";
import { FS } from "./utils/fs.js";
import { isProduction } from "./utils/isProduction.js";
import { createDebug } from "./utils/createDebug.js";

const debug = createDebug("I18nService");

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
    arg?: Record<string, any>,
  ): string;
}

export class BaseI18nService extends I18nService {
  static [INJECT] = [ModuleDefinitions];

  private readonly translations = new Map<string, Map<string, string>>();
  private readonly compiledTemplates = new Map<
    string,
    Map<string, (data: any) => string>
  >();

  constructor(private readonly modules: ModuleDefinitions) {
    super();
  }

  override init() {
    return this.loadTranslations();
  }

  private async loadTranslations() {
    for (const module of this.modules.modules) {
      if (!module.assetsDir) {
        continue;
      }
      try {
        const directoryPath = FS.join(module.assetsDir, "i18n");
        debug("loading translations from directory %s", directoryPath);

        for (const filename of await FS.readDirRecursively(directoryPath)) {
          if (!filename.endsWith(".json")) {
            continue;
          }
          const filePath = FS.join(module.assetsDir, "i18n", filename);
          debug("loading translations from file %s", filePath);

          const content = await FS.readFile(filePath);
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
      } catch (e) {}
    }
  }

  override availableLocales() {
    return Array.from(this.translations.keys()) as Locale[];
  }

  override translate(
    _ctx: Context,
    locale: Locale,
    key: string,
    arg: Record<string, any> = {},
  ) {
    const value = this.translations.get(locale)?.get(key);
    if (value && value.includes("<%")) {
      return this.compileAndExecuteTemplate(locale, key, value, arg);
    } else {
      return value || "";
    }
  }

  private compileTemplate(locale: Locale, key: string, value: string) {
    if (!isProduction) {
      return compileTemplate(value);
    }

    let localizedCompiledTemplates = this.compiledTemplates.get(locale);
    if (!localizedCompiledTemplates) {
      this.compiledTemplates.set(
        locale,
        (localizedCompiledTemplates = new Map()),
      );
    }

    let compiled = localizedCompiledTemplates.get(key);
    if (!compiled) {
      compiled = compileTemplate(value);
      localizedCompiledTemplates.set(key, compiled);
    }

    return compiled;
  }

  private compileAndExecuteTemplate(
    locale: Locale,
    key: string,
    value: string,
    arg: Record<string, any>,
  ) {
    try {
      return this.compileTemplate(locale, key, value)(arg);
    } catch (e) {
      debug("error while translating key %s: %s", key, (e as Error).message);
      return "";
    }
  }
}
