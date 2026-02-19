import {
  AdminAuditService,
  AdminEndpoint,
  computeBaseUrl,
  createCookie,
  EntityNotFoundError,
  type HttpContext,
  I18nService,
  INJECT,
  type UserId,
} from "@tymber/core";
import { UserRepository } from "../repositories/UserRepository.js";
import type { JSONSchemaType } from "ajv";
import { SESSION_COOKIE } from "../middlewares/ParseSession.js";

interface PathParams {
  userId: UserId;
}

const ONE_HOUR_IN_SECONDS = 60 * 60;

export class ImpersonateUser extends AdminEndpoint {
  static [INJECT] = [UserRepository, AdminAuditService, I18nService];

  constructor(
    private readonly userRepository: UserRepository,
    private readonly adminAuditService: AdminAuditService,
    i18n: I18nService,
  ) {
    super();

    adminAuditService.defineCustomDescription(
      "IMPERSONATE_USER",
      async (ctx, log) => {
        const { userId } = log.details;
        const user = await this.userRepository.findById(ctx, userId);

        const baseUrl = computeBaseUrl(ctx.headers);
        const userUrl = `${baseUrl}/admin/users/${userId}`;

        return i18n.translate(
          ctx,
          ctx.locale,
          "tymber.adminAuditLogs.IMPERSONATE_USER.description",
          {
            user,
            userUrl,
          },
        );
      },
    );
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

    try {
      const sessionId = await this.userRepository.startTransaction(
        ctx,
        async () => {
          const [sessionId] = await Promise.all([
            this.userRepository.createSession(ctx, userId),
            this.adminAuditService.log(ctx, "IMPERSONATE_USER", { userId }),
          ]);

          return sessionId;
        },
      );

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
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        return this.badRequest("user not found");
      } else {
        throw e;
      }
    }
  }
}
