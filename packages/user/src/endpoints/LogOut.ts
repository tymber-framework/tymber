import { UserEndpoint, type HttpContext, INJECT } from "@tymber/core";
import {
  SessionRepository,
  type SessionId,
} from "../repositories/SessionRepository.js";
import { CookieService } from "../services/CookieService.js";

export class LogOut extends UserEndpoint {
  static [INJECT] = [SessionRepository, CookieService];

  public openapi = {
    summary: "Logout the current user",
    responses: {
      204: {
        description: "User logged out successfully",
      },
      401: {
        description: "Unauthorized",
      },
    },
  };

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly cookieService: CookieService,
  ) {
    super();
  }

  override async handle(ctx: HttpContext) {
    const { sessionId } = ctx;

    if (sessionId) {
      try {
        await this.sessionRepository.deleteById(ctx, sessionId as SessionId);
      } catch (e) {}
    }

    return new Response(null, {
      status: 204,
      headers: {
        "set-cookie": this.cookieService.createExpiredCookie(),
      },
    });
  }
}
