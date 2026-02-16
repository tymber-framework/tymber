import { Component } from "./Component.js";
import { type HttpContext } from "./HttpContext.js";

export abstract class Handler extends Component {
  protected allowAnonymous = false;

  protected hasPermission(ctx: HttpContext) {
    return true;
  }

  public abstract doHandle(ctx: HttpContext): Response | Promise<Response>;

  protected abstract handle(ctx: HttpContext): Response | Promise<Response>;
}
