import { type JSONSchemaType } from "ajv";
import { hash } from "argon2";
import {
  type AdminUser,
  AdminUserRepository,
} from "../repositories/AdminUserRepository.js";
import {
  AdminAuditService,
  AdminEndpoint,
  type HttpContext,
  INJECT,
  type Result,
} from "@tymber/core";

interface Payload {
  password: string;
}

export class InitPassword extends AdminEndpoint {
  static [INJECT] = [AdminUserRepository, AdminAuditService];

  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly adminAuditService: AdminAuditService,
  ) {
    super();
  }

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      password: { type: "string", minLength: 8, maxLength: 100 },
    },
    required: ["password"],
  };

  async handle(ctx: HttpContext<Payload>) {
    const { payload } = ctx;

    const result: Result = await this.adminUserRepository.startTransaction(
      ctx,
      async () => {
        const user = (await this.adminUserRepository.findById(
          ctx,
          ctx.admin!.id,
        )) as AdminUser;

        if (!user.isTemporaryPassword) {
          return { ok: false, reason: "password already set" };
        }

        await Promise.all([
          this.adminUserRepository.update(ctx, {
            id: ctx.admin!.id,
            password: await hash(payload.password),
            isTemporaryPassword: false,
          }),
          this.adminAuditService.log(ctx, "INIT_PASSWORD"),
        ]);

        return { ok: true };
      },
    );

    if (!result.ok) {
      return this.badRequest(result.reason);
    }

    return new Response(null, {
      status: 204,
    });
  }
}
