import { Endpoint, type HttpContext } from "@tymber/core";

export class HelloWorld extends Endpoint {
  async handle(ctx: HttpContext) {
    return Response.json({ message: "Hello World" });
  }
}
