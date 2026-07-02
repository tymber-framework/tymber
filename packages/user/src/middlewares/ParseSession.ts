import { type HttpContext, INJECT, Middleware } from "@tymber/core";
import { UserRepository } from "../repositories/UserRepository.js";
import { CookieService } from "../services/CookieService.js";

export class ParseSession extends Middleware {
  static [INJECT] = [UserRepository, CookieService];

  constructor(
    private readonly userRepository: UserRepository,
    private readonly cookieService: CookieService,
  ) {
    super();
  }

  override async handle(ctx: HttpContext) {
    const sessionId = ctx.cookies["sid"];

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
        this.cookieService.createExpiredCookie(),
      );
    }
  }
}
