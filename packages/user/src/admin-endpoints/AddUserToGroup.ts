import {
  AdminAuditService,
  AdminEndpoint,
  computeBaseUrl,
  DuplicateKeyError,
  EntityNotFoundError,
  type GroupId,
  type HttpContext,
  I18nService,
  INJECT,
  type UserId,
} from "@tymber/core";
import { USER_ROLES, UserRepository } from "../repositories/UserRepository.js";
import type { JSONSchemaType } from "ajv";
import { GroupRepository } from "../repositories/GroupRepository.js";

interface PathParams {
  userId: UserId;
  groupId: GroupId;
}

interface Payload {
  role: number;
}

export class AddUserToGroup extends AdminEndpoint {
  static [INJECT] = [
    UserRepository,
    AdminAuditService,
    GroupRepository,
    I18nService,
  ];

  constructor(
    private readonly userRepository: UserRepository,
    private readonly adminAuditService: AdminAuditService,
    groupRepository: GroupRepository,
    i18n: I18nService,
  ) {
    super();

    adminAuditService.defineCustomDescription(
      "ADD_USER_TO_GROUP",
      async (ctx, log) => {
        const [user, group] = await Promise.all([
          this.userRepository.findById(ctx, log.details.userId),
          groupRepository.findById(ctx, log.details.groupId),
        ]);

        const baseUrl = computeBaseUrl(ctx.headers);
        const userUrl = `${baseUrl}/admin/users/${log.details.userId}`;
        const groupUrl = `${baseUrl}/admin/groups/${log.details.groupId}`;

        const role = i18n.translate(
          ctx,
          ctx.locale,
          `tymber.user.roles.${log.details.role}`,
        );

        return i18n.translate(
          ctx,
          ctx.locale,
          "tymber.adminAuditLogs.ADD_USER_TO_GROUP.description",
          {
            user,
            userUrl,
            group,
            groupUrl,
            role,
          },
        );
      },
    );
  }

  pathParamsSchema: JSONSchemaType<PathParams> = {
    type: "object",
    properties: {
      userId: { type: "string", format: "uuid" },
      groupId: { type: "string", format: "uuid" },
    },
    required: ["userId", "groupId"],
  };

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      role: { type: "integer", minimum: 0 },
    },
    required: ["role"],
  };

  async handle(ctx: HttpContext<Payload, PathParams>) {
    const { payload, pathParams } = ctx;
    const { userId, groupId } = pathParams;
    const { role } = payload;

    if (!USER_ROLES.includes(role)) {
      return this.badRequest("invalid role");
    }

    try {
      await this.userRepository.startTransaction(ctx, async () => {
        await Promise.all([
          this.userRepository.addUserToGroup(ctx, userId, groupId, role),
          this.adminAuditService.log(ctx, "ADD_USER_TO_GROUP", {
            userId,
            groupId,
            role,
          }),
        ]);
      });
    } catch (e) {
      if (e instanceof DuplicateKeyError) {
        return this.badRequest("user already in group");
      } else if (e instanceof EntityNotFoundError) {
        return this.badRequest("user or group not found");
      }
      throw e;
    }

    return new Response(null, {
      status: 204,
    });
  }
}
