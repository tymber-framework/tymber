import {
  AdminEndpoint,
  EntityNotFoundError,
  type GroupId,
  type HttpContext,
  INJECT,
  type UserId,
} from "@tymber/core";
import { UserRepository } from "../repositories/UserRepository.js";
import type { JSONSchemaType } from "ajv";

interface PathParams {
  userId: UserId;
  groupId: GroupId;
}

export class RemoveUserFromGroup extends AdminEndpoint {
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
    required: ["userId"],
  };

  async handle(ctx: HttpContext<never, PathParams>) {
    const { pathParams } = ctx;

    try {
      await this.userRepository.removeUserFromGroup(
        ctx,
        pathParams.userId,
        pathParams.groupId,
      );
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
