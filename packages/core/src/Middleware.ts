import type { HttpContext } from "./HttpContext.js";
import { Component } from "./Component.js";

export abstract class Middleware extends Component {
  private _middlewareBrand!: void; // nominal typing

  public abstract handle(
    ctx: HttpContext,
  ): void | Response | Promise<void | Response>;
}
