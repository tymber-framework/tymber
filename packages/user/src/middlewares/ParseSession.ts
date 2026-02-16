import {
  createCookie,
  type HttpContext,
  INJECT,
  Middleware,
} from "@tymber/core";
import { UserRepository } from "../repositories/UserRepository.js";

export const SESSION_COOKIE = "sid";

export class ParseSession extends Middleware {
  static [INJECT] = [UserRepository];

  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  override async handle(ctx: HttpContext) {
    const sessionId = ctx.cookies[SESSION_COOKIE];

    if (!sessionId) {
      return;
    }

    const user = await this.userRepository.findBySessionId(ctx, sessionId);

    if (user) {
      ctx.sessionId = sessionId;
      ctx.user = user;
    } else {
      ctx.responseHeaders.append(
        "set-cookie",
        createCookie(SESSION_COOKIE, "", {
          path: "/",
          httpOnly: true,
          maxAge: 0,
        }),
      );
    }
  }
}
