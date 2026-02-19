import {
  AdminAuditService,
  type Context,
  type HttpContext,
  I18nService,
  INJECT,
} from "@tymber/core";
import {
  AdminAuditRepository,
  type Query,
} from "../repositories/AdminAuditRepository.js";

type CustomDescription = (
  ctx: HttpContext,
  log: { id: number; details: Record<string, any> },
) => Promise<string>;

export class AdminAuditServiceImpl extends AdminAuditService {
  #customDescriptions = new Map<string, CustomDescription>();

  static [INJECT] = [AdminAuditRepository, I18nService];

  constructor(
    private readonly adminAuditRepository: AdminAuditRepository,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  defineCustomDescription(
    action: string,
    customDescription: CustomDescription,
  ): void {
    this.#customDescriptions.set(action, customDescription);
  }

  log(
    ctx: Context,
    action: string,
    details: Record<string, any>,
  ): Promise<void> {
    return this.adminAuditRepository.log(ctx, action, details);
  }

  async find(ctx: HttpContext, query: Query) {
    const { items } = await this.adminAuditRepository.find(ctx, query);

    const itemsWithDescription = await Promise.all(
      items.map(async (item) => {
        let description: string;

        if (this.#customDescriptions.has(item.action)) {
          description = await this.#customDescriptions.get(item.action)!(
            ctx,
            item,
          );
        } else {
          description = this.i18n.translate(
            ctx,
            ctx.locale,
            `tymber.adminAuditLogs.${item.action}.description`,
          );
        }

        return {
          id: item.id,
          createdAt: item.createdAt,
          createdBy: {
            id: item.createdBy.id,
            username: item.createdBy.username,
          },
          action: item.action,
          description,
        };
      }),
    );

    return { items: itemsWithDescription };
  }
}
