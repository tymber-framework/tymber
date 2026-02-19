import {
  AdminAuditService,
  AdminEndpoint,
  type HttpContext,
  INJECT,
} from "@tymber/core";
import { type JSONSchemaType } from "ajv";
import { hash } from "argon2";
import { AdminUserRepository } from "../repositories/AdminUserRepository.js";
import { MiscRepository } from "../repositories/MiscRepository.js";
import { AdminCookieService } from "../services/AdminCookieService.js";

interface Payload {
  applicationName: string;
  environmentName: string;
  environmentColorHex: string;
  username: string;
  password: string;
}

export class Init extends AdminEndpoint {
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

  allowAnonymous = true;

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
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload>) {
    const { payload, headers } = ctx;

    try {
      const sessionId = await this.adminUserRepository.startTransaction(
        ctx,
        async () => {
          if (await this.miscRepository.findById(ctx, "app")) {
            throw "already initialized";
          }

          const { id } = await this.adminUserRepository.save(ctx, {
            username: payload.username,
            password: await hash(payload.password),
          });

          ctx.admin = { id };

          const [sessionId] = await Promise.all([
            this.adminUserRepository.createSession(ctx, id),
            this.miscRepository.save(ctx, {
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
      if (e === "already initialized") {
        return this.badRequest("already initialized");
      } else {
        throw e;
      }
    }
  }
}
