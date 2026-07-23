import {
  AdminAuditService,
  AdminEndpoint,
  computeBaseUrl,
  type HttpContext,
  I18nService,
  INJECT,
  type UserRole,
} from "@tymber/core";
import { UserRepository } from "../repositories/UserRepository.js";
import { UserRoleRegistry } from "../services/UserRoleRegistry.js";
import type { JSONSchemaType } from "ajv";
import { toUserId } from "../utils/toUserId.js";

interface PathParams {
  userId: string;
}

interface Payload {
  role: number;
}

export class UpdateUserRole extends AdminEndpoint {
  static [INJECT] = [
    UserRepository,
    UserRoleRegistry,
    AdminAuditService,
    I18nService,
  ];

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userRoleRegistry: UserRoleRegistry,
    private readonly adminAuditService: AdminAuditService,
    i18n: I18nService,
  ) {
    super();

    this.adminAuditService.defineCustomDescription(
      "UPDATE_USER_ROLE",
      async (ctx, log) => {
        const user = await this.userRepository.findById(
          ctx,
          log.details.userId,
        );

        const baseUrl = computeBaseUrl(ctx.headers);
        const userUrl = `${baseUrl}/admin/users/${log.details.userId}`;

        const role = i18n.translate(
          ctx,
          ctx.locale,
          `tymber.user.userRoles.${log.details.role}`,
        );

        return i18n.translate(
          ctx,
          ctx.locale,
          "tymber.adminAuditLogs.UPDATE_USER_ROLE.description",
          {
            user,
            userUrl,
            role,
          },
        );
      },
    );
  }

  pathParamsSchema: JSONSchemaType<PathParams> = {
    type: "object",
    properties: {
      userId: { type: "string", pattern: "^[0-9]+$" },
    },
    required: ["userId"],
  };

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      role: { type: "integer", minimum: 0 },
    },
    required: ["role"],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload, PathParams>) {
    const { payload, pathParams } = ctx;
    const { userId } = pathParams;
    const { role } = payload;

    if (!this.userRoleRegistry.has(role as UserRole)) {
      return this.badRequest("invalid role");
    }

    const user = await this.userRepository.findById(ctx, toUserId(userId));

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

    await this.userRepository.startTransaction(ctx, async () => {
      await this.userRepository.update(ctx, {
        id: user.id,
        role: role as UserRole,
      });

      await this.adminAuditService.log(ctx, "UPDATE_USER_ROLE", {
        userId,
        role,
      });
    });

    return new Response(null, {
      status: 204,
    });
  }
}
