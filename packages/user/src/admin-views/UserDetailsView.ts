import {
  AdminView,
  type HttpContext,
  I18nService,
  INJECT,
  type UserId,
} from "@tymber/core";
import { USER_ROLES, UserRepository } from "../repositories/UserRepository.js";
import type { JSONSchemaType } from "ajv";

interface PathParams {
  userId: UserId;
}

export class UserDetailsView extends AdminView {
  static [INJECT] = [UserRepository, I18nService];

  constructor(
    private readonly userRepository: UserRepository,
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
    const roles = USER_ROLES.map((role) => ({
      id: role,
      text: this.i18nService.translate(
        ctx,
        ctx.locale,
        `tymber.user.roles.${role}`,
      ),
    }));

    return ctx.render(["admin.layout", "admin.app-layout", "admin.user"], {
      user,
      roles,
    });
  }
}
