import { createCookie, Endpoint, type HttpContext, INJECT } from "@tymber/core";
import {
  type SessionId,
  UserRepository,
} from "../repositories/UserRepository.js";
import { SESSION_COOKIE } from "../middlewares/ParseSession.js";

export class LogOut extends Endpoint {
  static [INJECT] = [UserRepository];

  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  override async handle(ctx: HttpContext) {
    const { sessionId } = ctx;

    if (sessionId) {
      await this.userRepository.deleteSession(ctx, sessionId as SessionId);
    }

    return new Response(null, {
      status: 204,
      headers: {
        "set-cookie": createCookie(SESSION_COOKIE, "", {
          path: "/",
          httpOnly: true,
          maxAge: 0,
        }),
      },
    });
  }
}
