import {
  AdminAuditService,
  AdminEndpoint,
  type HttpContext,
  I18nService,
  INJECT,
} from "@tymber/core";
import { AdminQueryRepository } from "../repositories/AdminQueryRepository.js";
import type { JSONSchemaType } from "ajv";

interface Payload {
  query: string;
  comment: string;
}

export class RunAdminQuery extends AdminEndpoint {
  static [INJECT] = [AdminQueryRepository, AdminAuditService, I18nService];

  constructor(
    private readonly adminQueryRepository: AdminQueryRepository,
    private readonly adminAuditService: AdminAuditService,
    i18n: I18nService,
  ) {
    super();
    adminAuditService.defineCustomDescription("RUN_ADMIN_QUERY", (ctx, log) => {
      const description = i18n.translate(
        ctx,
        ctx.locale,
        `tymber.adminAuditLogs.RUN_ADMIN_QUERY.description`,
        log.details,
      );
      return Promise.resolve(description);
    });
  }

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      query: { type: "string", maxLength: 1000 },
      comment: { type: "string", maxLength: 1000 },
    },
    required: ["query", "comment"],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload>) {
    const { payload } = ctx;

    try {
      const affectedRows = await this.adminQueryRepository.startTransaction(
        ctx,
        async () => {
          const { id, affectedRows } = await this.adminQueryRepository.runQuery(
            ctx,
            payload.query,
            payload.comment,
          );

          await this.adminAuditService.log(ctx, "RUN_ADMIN_QUERY", {
            id,
            affectedRows,
          });

          return affectedRows;
        },
      );

      return Response.json({ affectedRows });
    } catch (_e) {
      return this.badRequest("invalid query");
    }
  }
}
