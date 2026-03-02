import {
  type HttpContext,
  INJECT,
  ModuleDefinitions,
  View,
} from "@tymber/core";
import { buildSpecification } from "../utils/buildSpecification.js";
import { type OpenAPI } from "../contrib/openapi-types.js";

export class Console extends View {
  static [INJECT] = [ModuleDefinitions];

  spec?: OpenAPI.Document;

  constructor(private readonly moduleDefinitions: ModuleDefinitions) {
    super();
  }

  allowAnonymous = true;

  handle(ctx: HttpContext): Response | Promise<Response> {
    if (!this.spec) {
      this.spec = buildSpecification(this.moduleDefinitions);

      // @ts-expect-error TODO proper typing
      const { name } = ctx.app;
      this.spec.info.title = name;
    }

    return ctx.render("console", { spec: this.spec });
  }
}
