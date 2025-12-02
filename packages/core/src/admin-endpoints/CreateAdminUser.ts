import {
  AdminEndpoint,
  DuplicateKeyError,
  type HttpContext,
  INJECT,
} from "@tymber/common";
import { type JSONSchemaType } from "ajv";
import { hash } from "argon2";
import { AdminUserRepository } from "../repositories/AdminUserRepository.js";

interface Payload {
  username: string;
  password: string;
}

export class CreateAdminUser extends AdminEndpoint {
  static [INJECT] = [AdminUserRepository];

  constructor(private readonly adminUserRepository: AdminUserRepository) {
    super();
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
      await this.adminUserRepository.save(ctx, {
        username: payload.username,
        password: await hash(payload.password),
        isTemporaryPassword: true,
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
