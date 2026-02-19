import { AdminView, type HttpContext, I18nService, INJECT } from "@tymber/core";
import { AdminAuditRepository } from "../repositories/AdminAuditRepository.js";

export class ListAdminAuditLogsView extends AdminView {
  static [INJECT] = [AdminAuditRepository, I18nService];

  constructor(
    private readonly adminAuditRepository: AdminAuditRepository,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  override async handle(ctx: HttpContext) {
    const [actions, adminUsers] = await Promise.all([
      this.adminAuditRepository.listDistinctActions(ctx),
      this.adminAuditRepository.listDistinctAdminUsers(ctx),
    ]);

    const actionsWithLabel = actions.map((action) => ({
      id: action,
      label: this.i18n.translate(
        ctx,
        ctx.locale,
        `tymber.adminAuditLogs.${action}.label`,
      ),
    }));

    return ctx.render(
      ["admin.layout", "admin.app-layout", "admin.admin-audit-logs"],
      {
        actions: actionsWithLabel,
        adminUsers,
      },
    );
  }
}
