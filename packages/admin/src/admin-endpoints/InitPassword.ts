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
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload>) {
    const { payload } = ctx;

    try {
      await this.adminUserRepository.startTransaction(ctx, async () => {
        const user = (await this.adminUserRepository.findById(
          ctx,
          ctx.admin!.id,
        )) as AdminUser;

        if (!user.isTemporaryPassword) {
          throw "password already set";
        }

        await Promise.all([
          this.adminUserRepository.save(ctx, {
            id: ctx.admin!.id,
            password: await hash(payload.password),
            isTemporaryPassword: false,
          }),
          this.adminAuditService.log(ctx, "INIT_PASSWORD"),
        ]);
      });
    } catch (e) {
      if (e === "password already set") {
        return this.badRequest("password already set");
      }
      throw e;
    }

    return new Response(null, {
      status: 204,
    });
  }
}
