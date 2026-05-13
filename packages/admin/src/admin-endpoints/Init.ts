import {
  AdminAuditService,
  Endpoint,
  type HttpContext,
  INJECT,
  type Result,
} from "@tymber/core";
import { type JSONSchemaType } from "ajv";
import { hash } from "argon2";
import {
  type AdminSessionId,
  AdminUserRepository,
} from "../repositories/AdminUserRepository.js";
import { MiscRepository } from "../repositories/MiscRepository.js";
import { AdminCookieService } from "../services/AdminCookieService.js";

interface Payload {
  applicationName: string;
  environmentName: string;
  environmentColorHex: string;
  username: string;
  password: string;
}

export class Init extends Endpoint {
  static [INJECT] = [
    MiscRepository,
    AdminUserRepository,
    AdminCookieService,
    AdminAuditService,
  ];

  constructor(
    private readonly miscRepository: MiscRepository,
    private readonly adminUserRepository: AdminUserRepository,
    private readonly adminCookieService: AdminCookieService,
    private readonly adminAuditService: AdminAuditService,
  ) {
    super();
  }

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      applicationName: { type: "string", minLength: 2, maxLength: 100 },
      environmentName: { type: "string", minLength: 2, maxLength: 100 },
      environmentColorHex: { type: "string", pattern: "^#([0-9A-Fa-f]{6})$" },
      username: { type: "string", minLength: 2, maxLength: 100 },
      password: { type: "string", minLength: 8, maxLength: 100 },
    },
    required: [
      "applicationName",
      "environmentName",
      "environmentColorHex",
      "username",
      "password",
    ],
  };

  async handle(ctx: HttpContext<Payload>) {
    const { payload, headers } = ctx;

    const result: Result<AdminSessionId> =
      await this.adminUserRepository.startTransaction(ctx, async () => {
        if (await this.miscRepository.findById(ctx, "app")) {
          return { ok: false, reason: "already initialized" };
        }

        const { id } = await this.adminUserRepository.insert(ctx, {
          username: payload.username,
          password: await hash(payload.password),
        });

        ctx.admin = { id };

        const [sessionId] = await Promise.all([
          this.adminUserRepository.createSession(ctx, id),
          this.miscRepository.insert(ctx, {
            key: "app",
            value: {
              name: payload.applicationName,
              environment: {
                name: payload.environmentName,
                color: payload.environmentColorHex,
              },
            },
          }),
          this.adminAuditService.log(ctx, "INIT"),
        ]);

        return { ok: true, value: sessionId };
      });

    if (!result.ok) {
      return this.badRequest(result.reason);
    }

    return new Response(null, {
      status: 204,
      headers: {
        "set-cookie": this.adminCookieService.createCookie(
          result.value,
          headers,
        ),
      },
    });
  }
}
