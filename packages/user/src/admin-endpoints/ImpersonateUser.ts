import {
  AdminEndpoint,
  createCookie,
  EntityNotFoundError,
  type HttpContext,
  INJECT,
  type UserId,
} from "@tymber/common";
import { UserRepository } from "../repositories/UserRepository.js";
import type { JSONSchemaType } from "ajv";
import { SESSION_COOKIE } from "../middlewares/ParseSession.js";

interface PathParams {
  userId: UserId;
}

const ONE_HOUR_IN_SECONDS = 60 * 60;

export class ImpersonateUser extends AdminEndpoint {
  static [INJECT] = [UserRepository];

  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  pathParamsSchema: JSONSchemaType<PathParams> = {
    type: "object",
    properties: {
      userId: { type: "string", format: "uuid" },
    },
    required: ["userId"],
  };

  async handle(ctx: HttpContext<never, PathParams, never>) {
    const { headers } = ctx;
    const { userId } = ctx.pathParams;
    let sessionId;

    try {
      sessionId = await this.userRepository.createSession(ctx, userId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        return this.badRequest("user not found");
      } else {
        throw e;
      }
    }

    const isSameSiteRequest = !headers.has("origin");

    return new Response(null, {
      status: 204,
      headers: {
        "set-cookie": createCookie(SESSION_COOKIE, sessionId, {
          path: "/",
          httpOnly: true,
          sameSite: isSameSiteRequest ? "strict" : "lax",
          maxAge: ONE_HOUR_IN_SECONDS,
        }),
      },
    });
  }
}
