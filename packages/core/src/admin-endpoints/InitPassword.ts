import { type JSONSchemaType } from "ajv";
import { hash } from "argon2";
import {
  type AdminUser,
  AdminUserRepository,
} from "../repositories/AdminUserRepository.js";
import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/common";

interface Payload {
  password: string;
}

export class InitPassword extends AdminEndpoint {
  static [INJECT] = [AdminUserRepository];

  constructor(private readonly adminUserRepository: AdminUserRepository) {
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

    const user = (await this.adminUserRepository.findById(
      ctx,
      ctx.admin!.id,
    )) as AdminUser;

    if (!user.isTemporaryPassword) {
      return this.badRequest("invalid state");
    }

    await this.adminUserRepository.save(ctx, {
      id: ctx.admin!.id,
      password: await hash(payload.password),
      isTemporaryPassword: false,
    });

    return new Response(null, {
      status: 204,
    });
  }
}
