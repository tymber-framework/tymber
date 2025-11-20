import { compileTemplate } from "./contrib/template.js";
import { ModuleDefinitions } from "./Module.js";
import { createDebug } from "./utils/createDebug.js";
import { Component, INJECT } from "./Component.js";
import { FS } from "./utils/fs.js";
import { isProduction } from "./utils/isProduction.js";

const debug = createDebug("TemplateService");

export abstract class TemplateService extends Component {
  public abstract canRender(templateName: string): boolean;

  public abstract render(
    templateName: string,
    data: Record<string, any>,
  ): Promise<string>;
}

export abstract class FileBasedTemplateService extends TemplateService {
  static [INJECT] = [ModuleDefinitions];

  abstract readonly fileExtension: string;
  protected templates = new Map<string, string>();

  constructor(private readonly modules: ModuleDefinitions) {
    super();
    this.modules = modules;
  }

  override init() {
    return this.loadTemplates();
  }

  private async loadTemplates() {
    for (const module of this.modules.modules) {
      if (!module.assetsDir) {
        return;
      }
      try {
        for (const filename of await FS.readDirRecursively(
          FS.join(module.assetsDir, "templates"),
        )) {
          const fileExtension = filename.slice(filename.lastIndexOf("."));

          if (fileExtension === this.fileExtension) {
            const viewName = filename.slice(0, filename.lastIndexOf("."));

            debug("adding template %s", viewName);

            if (this.templates.has(viewName)) {
              debug("overriding existing template %s", viewName);
            }

            this.templates.set(
              viewName,
              FS.join(module.assetsDir, "templates", filename),
            );
          }
        }
      } catch (e) {}
    }
  }

  override canRender(templateName: string) {
    return this.templates.has(templateName);
  }
}

export class BaseTemplateService extends FileBasedTemplateService {
  override fileExtension = ".html";

  // TODO use a LRU cache
  private compiledTemplates = new Map<
    string,
    (data: Record<string, any>) => string
  >();

  override render(templateName: string, data: Record<string, any>) {
    return this.getTemplate(templateName).then((template) => template(data));
  }

  private async getTemplate(templateName: string) {
    if (isProduction && this.compiledTemplates.has(templateName)) {
      return this.compiledTemplates.get(templateName)!;
    }

    const absolutePath = this.templates.get(templateName)!;
    const content = await FS.readFile(absolutePath);
    const compiledTemplate = compileTemplate(content);

    if (isProduction) {
      this.compiledTemplates.set(templateName, compiledTemplate);
    }

    return compiledTemplate;
  }
}
