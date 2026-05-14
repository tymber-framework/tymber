import { type JSONSchemaType } from "ajv";
import { verify } from "argon2";
import {
  type AdminSessionId,
  AdminUserRepository,
} from "../repositories/AdminUserRepository.js";
import {
  AdminAuditService,
  Endpoint,
  type HttpContext,
  INJECT,
  type Result,
} from "@tymber/core";
import { AdminCookieService } from "../services/AdminCookieService.js";
import { AdminUserService } from "../services/AdminUserService.js";

interface Payload {
  username: string;
  password: string;
}

export class LogIn extends Endpoint {
  static [INJECT] = [
    AdminUserRepository,
    AdminCookieService,
    AdminUserService,
    AdminAuditService,
  ];

  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly adminCookieService: AdminCookieService,
    private readonly adminUserService: AdminUserService,
    private readonly adminAuditService: AdminAuditService,
  ) {
    super();
  }

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      username: { type: "string", maxLength: 100 },
      password: { type: "string", maxLength: 100 },
    },
    required: ["username", "password"],
  };

  async handle(ctx: HttpContext<Payload>) {
    const { payload } = ctx;

    const result: Result<AdminSessionId> =
      await this.adminUserRepository.startTransaction(ctx, async () => {
        const adminUser = await this.adminUserRepository.findByUsername(
          ctx,
          payload.username,
        );

        if (!adminUser) {
          return { ok: false, reason: "invalid credentials" };
        }

        const isPasswordValid = await verify(
          adminUser.password!,
          payload.password,
        );

        if (!isPasswordValid) {
          return { ok: false, reason: "invalid credentials" };
        }

        ctx.admin = { id: adminUser.id };

        const [sessionId] = await Promise.all([
          this.adminUserService.createSession(ctx, adminUser.id),
          this.adminAuditService.log(ctx, "LOG_IN"),
        ]);

        return { ok: true, value: sessionId };
      });

    if (!result.ok) {
      return this.badRequest(result.reason);
    }

    return new Response(null, {
      status: 204,
      headers: {
        "set-cookie": this.adminCookieService.createCookie(result.value),
      },
    });
  }
}
