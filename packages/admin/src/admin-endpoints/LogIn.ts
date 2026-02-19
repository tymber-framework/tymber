import { type JSONSchemaType } from "ajv";
import { verify } from "argon2";
import { AdminUserRepository } from "../repositories/AdminUserRepository.js";
import {
  AdminAuditService,
  AdminEndpoint,
  type HttpContext,
  INJECT,
} from "@tymber/core";
import { AdminCookieService } from "../services/AdminCookieService.js";

interface Payload {
  username: string;
  password: string;
}

export class LogIn extends AdminEndpoint {
  static [INJECT] = [
    AdminUserRepository,
    AdminCookieService,
    AdminAuditService,
  ];

  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly adminCookieService: AdminCookieService,
    private readonly adminAuditService: AdminAuditService,
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

    try {
      const sessionId = await this.adminUserRepository.startTransaction(
        ctx,
        async () => {
          const adminUser = await this.adminUserRepository.findByUsername(
            ctx,
            payload.username,
          );

          if (!adminUser) {
            throw "invalid credentials";
          }

          const isPasswordValid = await verify(
            adminUser.password!,
            payload.password,
          );

          if (!isPasswordValid) {
            throw "invalid credentials";
          }

          ctx.admin = { id: adminUser.id };

          const [sessionId] = await Promise.all([
            this.adminUserRepository.createSession(ctx, adminUser.id),
            this.adminAuditService.log(ctx, "LOG_IN"),
          ]);

          return sessionId;
        },
      );

      return new Response(null, {
        status: 204,
        headers: {
          "set-cookie": this.adminCookieService.createCookie(
            sessionId,
            headers,
          ),
        },
      });
    } catch (e) {
      if (e === "invalid credentials") {
        return this.badRequest("invalid credentials");
      } else {
        throw e;
      }
    }
  }
}
