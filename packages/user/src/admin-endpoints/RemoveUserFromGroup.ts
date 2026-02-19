import {
  AdminAuditService,
  AdminEndpoint,
  computeBaseUrl,
  EntityNotFoundError,
  type GroupId,
  type HttpContext,
  I18nService,
  INJECT,
  type UserId,
} from "@tymber/core";
import { UserRepository } from "../repositories/UserRepository.js";
import type { JSONSchemaType } from "ajv";
import { GroupRepository } from "../repositories/GroupRepository.js";

interface PathParams {
  userId: UserId;
  groupId: GroupId;
}

export class RemoveUserFromGroup extends AdminEndpoint {
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
      "REMOVE_USER_FROM_GROUP",
      async (ctx, log) => {
        const [user, group] = await Promise.all([
          this.userRepository.findById(ctx, log.details.userId),
          groupRepository.findById(ctx, log.details.groupId),
        ]);

        const baseUrl = computeBaseUrl(ctx.headers);
        const userUrl = `${baseUrl}/admin/users/${log.details.userId}`;
        const groupUrl = `${baseUrl}/admin/groups/${log.details.groupId}`;

        return i18n.translate(
          ctx,
          ctx.locale,
          "tymber.adminAuditLogs.REMOVE_USER_FROM_GROUP.description",
          {
            user,
            userUrl,
            group,
            groupUrl,
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
    required: ["userId"],
  };

  async handle(ctx: HttpContext<never, PathParams>) {
    const { pathParams } = ctx;
    const { userId, groupId } = pathParams;

    try {
      await this.userRepository.startTransaction(ctx, async () => {
        await Promise.all([
          this.userRepository.removeUserFromGroup(ctx, userId, groupId),
          this.adminAuditService.log(ctx, "REMOVE_USER_FROM_GROUP", {
            userId,
            groupId,
          }),
        ]);
      });
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        return this.badRequest("user not in group");
      } else {
        throw e;
      }
    }

    return new Response(null, {
      status: 204,
    });
  }
}
