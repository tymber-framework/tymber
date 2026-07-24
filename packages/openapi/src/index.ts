import { FS, type Module } from "@tymber/core";
import { Console } from "./views/Console.js";

export const OpenAPIModule: Module = {
  name: "@tymber/openapi",
  version: "0.1.3",

  assetsDir: FS.join(import.meta.dirname, "..", "assets"),

  init(app) {
    app.view("/console", Console);
  },
};

export { buildSpecification } from "./utils/buildSpecification.js";
