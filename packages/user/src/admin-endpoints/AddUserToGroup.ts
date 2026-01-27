import {
  AdminEndpoint,
  DuplicateKeyError,
  EntityNotFoundError,
  type GroupId,
  type HttpContext,
  INJECT,
  type UserId,
} from "@tymber/common";
import { USER_ROLES, UserRepository } from "../repositories/UserRepository.js";
import type { JSONSchemaType } from "ajv";

interface PathParams {
  userId: UserId;
  groupId: GroupId;
}

interface Payload {
  role: number;
}

export class AddUserToGroup extends AdminEndpoint {
  static [INJECT] = [UserRepository];

  constructor(private readonly userRepository: UserRepository) {
    super();
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

    if (!USER_ROLES.includes(payload.role)) {
      return this.badRequest("invalid role");
    }

    try {
      await this.userRepository.addUserToGroup(
        ctx,
        pathParams.userId,
        pathParams.groupId,
        payload.role,
      );
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
