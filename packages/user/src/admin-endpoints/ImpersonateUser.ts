import {
  AdminAuditService,
  AdminEndpoint,
  computeBaseUrl,
  type HttpContext,
  I18nService,
  INJECT,
  type UserId,
} from "@tymber/core";
import { UserRepository } from "../repositories/UserRepository.js";
import type { JSONSchemaType } from "ajv";
import { CookieService } from "../services/CookieService.js";
import { UserService } from "../services/UserService.js";

interface PathParams {
  userId: UserId;
}

export class ImpersonateUser extends AdminEndpoint {
  static [INJECT] = [
    UserRepository,
    UserService,
    CookieService,
    AdminAuditService,
    I18nService,
  ];

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly cookieService: CookieService,
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

  async handle(ctx: HttpContext<never, PathParams>) {
    const { userId } = ctx.pathParams;

    const user = await this.userRepository.findById(ctx, userId);

    if (!user) {
      return Response.json(
        {
          message: "user not found",
        },
        {
          status: 404,
        },
      );
    }

    const sessionId = await this.userRepository.startTransaction(
      ctx,
      async () => {
        const sessionId = await this.userService.createSession(ctx, user);

        await this.adminAuditService.log(ctx, "IMPERSONATE_USER", { userId });

        return sessionId;
      },
    );

    return new Response(null, {
      status: 204,
      headers: {
        "set-cookie": this.cookieService.createCookie(sessionId),
      },
    });
  }
}
