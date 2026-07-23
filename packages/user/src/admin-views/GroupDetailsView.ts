import { AdminView, type HttpContext, INJECT, I18nService } from "@tymber/core";
import { GroupRepository } from "../repositories/GroupRepository.js";
import type { JSONSchemaType } from "ajv";
import { GroupRoleRegistry } from "../services/GroupRoleRegistry.js";
import { toGroupId } from "../utils/toGroupId.js";

interface PathParams {
  groupId: string;
}

export class GroupDetailsView extends AdminView {
  static [INJECT] = [GroupRepository, GroupRoleRegistry, I18nService];

  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly groupRoleRegistry: GroupRoleRegistry,
    private readonly i18nService: I18nService,
  ) {
    super();
  }

  pathParamsSchema: JSONSchemaType<PathParams> = {
    type: "object",
    properties: {
      groupId: { type: "string", pattern: "^[0-9]+$" },
    },
    required: ["groupId"],
  };

  async handle(ctx: HttpContext<never, PathParams>) {
    const { groupId } = ctx.pathParams;
    const group = await this.groupRepository.findById(ctx, toGroupId(groupId));

    if (!group) {
      return ctx.redirect("/admin/groups?group_not_found=1");
    }

    // TODO create a cache (per locale)
    const groupRoles = this.groupRoleRegistry.all().map((role) => ({
      id: role,
      text: this.i18nService.translate(
        ctx,
        ctx.locale,
        `tymber.user.groupRoles.${role}`,
      ),
    }));

    return ctx.render(["admin.layout", "admin.app-layout", "admin.group"], {
      group,
      groupRoles,
    });
  }
}
