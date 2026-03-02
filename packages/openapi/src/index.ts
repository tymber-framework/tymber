import { FS, type Module } from "@tymber/core";
import { Console } from "./views/Console.js";

export const OpenApiModule: Module = {
  name: "@tymber/openapi",
  version: "0.0.1",

  assetsDir: FS.join(import.meta.dirname, "..", "assets"),

  init(app) {
    app.view("/console", Console);
  },
};

export { buildSpecification } from "./utils/buildSpecification.js";
