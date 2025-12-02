import { type JSONSchemaType } from "ajv";
import { verify } from "argon2";
import { AdminUserRepository } from "../repositories/AdminUserRepository.js";
import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/common";
import { AdminCookieService } from "../services/AdminCookieService.js";

interface Payload {
  username: string;
  password: string;
}

export class LogIn extends AdminEndpoint {
  static [INJECT] = [AdminUserRepository, AdminCookieService];

  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly adminCookieService: AdminCookieService,
  ) {
    super();
  }

  allowAnonymous = true;

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      username: { type: "string", maxLength: 100 },
      password: { type: "string", maxLength: 100 },
    },
    required: ["username", "password"],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload>) {
    const { payload, headers } = ctx;

    const adminUser = await this.adminUserRepository.findByUsername(
      ctx,
      payload.username,
    );

    if (!adminUser) {
      return this.badRequest("invalid credentials");
    }

    const isPasswordValid = await verify(adminUser.password!, payload.password);

    if (!isPasswordValid) {
      return this.badRequest("invalid credentials");
    }

    const sessionId = await this.adminUserRepository.createSession(
      ctx,
      adminUser.id,
    );

    return new Response(null, {
      status: 204,
      headers: {
        "set-cookie": this.adminCookieService.createCookie(sessionId, headers),
      },
    });
  }
}
