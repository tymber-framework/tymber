import {
  AdminView,
  type HttpContext,
  I18nService,
  INJECT,
  type UserId,
} from "@tymber/core";
import { UserRepository } from "../repositories/UserRepository.js";
import { UserRoleRegistry } from "../services/UserRoleRegistry.js";
import { GroupRoleRegistry } from "../services/GroupRoleRegistry.js";
import type { JSONSchemaType } from "ajv";

interface PathParams {
  userId: UserId;
}

export class UserDetailsView extends AdminView {
  static [INJECT] = [
    UserRepository,
    UserRoleRegistry,
    GroupRoleRegistry,
    I18nService,
  ];

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userRoleRegistry: UserRoleRegistry,
    private readonly groupRoleRegistry: GroupRoleRegistry,
    private readonly i18nService: I18nService,
  ) {
    super();
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
      return ctx.redirect("/admin/users?user_not_found=1");
    }

    // TODO create a cache (per locale)
    const userRoles = this.userRoleRegistry.all().map((role) => ({
      id: role,
      text: this.i18nService.translate(
        ctx,
        ctx.locale,
        `tymber.user.userRoles.${role}`,
      ),
    }));

    const groupRoles = this.groupRoleRegistry.all().map((role) => ({
      id: role,
      text: this.i18nService.translate(
        ctx,
        ctx.locale,
        `tymber.user.groupRoles.${role}`,
      ),
    }));

    return ctx.render(["admin.layout", "admin.app-layout", "admin.user"], {
      user,
      userRoles,
      groupRoles,
    });
  }
}
