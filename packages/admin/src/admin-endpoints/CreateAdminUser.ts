import {
  AdminAuditService,
  AdminEndpoint,
  DuplicateKeyError,
  type HttpContext,
  I18nService,
  INJECT,
} from "@tymber/core";
import { type JSONSchemaType } from "ajv";
import { hash } from "argon2";
import { AdminUserRepository } from "../repositories/AdminUserRepository.js";

interface Payload {
  username: string;
  password: string;
}

export class CreateAdminUser extends AdminEndpoint {
  static [INJECT] = [AdminUserRepository, AdminAuditService, I18nService];

  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly adminAuditService: AdminAuditService,
    i18n: I18nService,
  ) {
    super();
    adminAuditService.defineCustomDescription(
      "CREATE_ADMIN_USER",
      async (ctx, log) => {
        const newUserId = log.details.id;
        const adminUser = await adminUserRepository.findById(ctx, newUserId);
        return i18n.translate(
          ctx,
          ctx.locale,
          "tymber.adminAuditLogs.CREATE_ADMIN_USER.description",
          adminUser,
        );
      },
    );
  }

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      username: { type: "string", minLength: 2, maxLength: 100 },
      password: { type: "string", minLength: 8, maxLength: 100 },
    },
    required: ["username", "password"],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload>) {
    const { payload } = ctx;

    try {
      await this.adminUserRepository.startTransaction(ctx, async () => {
        const { id } = await this.adminUserRepository.save(ctx, {
          username: payload.username,
          password: await hash(payload.password),
          isTemporaryPassword: true,
        });

        await this.adminAuditService.log(ctx, "CREATE_ADMIN_USER", {
          id,
        });
      });
    } catch (e) {
      if (e instanceof DuplicateKeyError) {
        return this.badRequest("username already exists");
      }
      throw e;
    }

    return new Response(null, { status: 204 });
  }
}
