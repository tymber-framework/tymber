import {
  AdminAuditService,
  AdminEndpoint,
  computeBaseUrl,
  DuplicateKeyError,
  type GroupId,
  type HttpContext,
  I18nService,
  INJECT,
  type UserId,
} from "@tymber/core";
import { USER_ROLES, UserRepository } from "../repositories/UserRepository.js";
import type { JSONSchemaType } from "ajv";
import { GroupRepository } from "../repositories/GroupRepository.js";
import { MembershipRepository } from "../repositories/MembershipRepository.js";

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
    MembershipRepository,
    AdminAuditService,
    GroupRepository,
    I18nService,
  ];

  constructor(
    private readonly userRepository: UserRepository,
    private readonly membershipRepository: MembershipRepository,
    private readonly adminAuditService: AdminAuditService,
    private readonly groupRepository: GroupRepository,
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
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload, PathParams>) {
    const { payload, pathParams } = ctx;
    const { userId, groupId } = pathParams;
    const { role } = payload;

    if (!USER_ROLES.includes(role)) {
      return this.badRequest("invalid role");
    }

    const [user, group] = await Promise.all([
      this.userRepository.findById(ctx, userId),
      this.groupRepository.findById(ctx, groupId),
    ]);

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

    if (!group) {
      return Response.json(
        {
          message: "group not found",
        },
        {
          status: 404,
        },
      );
    }

    try {
      await this.membershipRepository.startTransaction(ctx, async () => {
        await this.membershipRepository.insert(ctx, {
          userId: user.internalId,
          groupId: group.internalId,
          role,
        });

        await this.adminAuditService.log(ctx, "ADD_USER_TO_GROUP", {
          userId,
          groupId,
          role,
        });
      });
    } catch (e) {
      if (e instanceof DuplicateKeyError) {
        return Response.json(
          {
            message: "user already in group",
          },
          {
            status: 409,
          },
        );
      }
      throw e;
    }

    return new Response(null, {
      status: 204,
    });
  }
}
