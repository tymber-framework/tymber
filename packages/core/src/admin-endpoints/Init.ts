import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/common";
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

export class Init extends AdminEndpoint {
  static [INJECT] = [MiscRepository, AdminUserRepository, AdminCookieService];

  constructor(
    private readonly miscRepository: MiscRepository,
    private readonly adminUserRepository: AdminUserRepository,
    private readonly adminCookieService: AdminCookieService,
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

    if (await this.miscRepository.findById(ctx, "app")) {
      return this.badRequest("already initialized");
    }

    let sessionId: AdminSessionId;

    await this.adminUserRepository.startTransaction(ctx, async () => {
      const { id } = await this.adminUserRepository.save(ctx, {
        username: payload.username,
        password: await hash(payload.password),
      });

      ctx.admin = { id };

      sessionId = await this.adminUserRepository.createSession(ctx, id);

      await this.miscRepository.save(ctx, {
        key: "app",
        value: {
          name: payload.applicationName,
          environment: {
            name: payload.environmentName,
            color: payload.environmentColorHex,
          },
        },
      });
    });

    return new Response(null, {
      status: 204,
      headers: {
        "set-cookie": this.adminCookieService.createCookie(sessionId!, headers),
      },
    });
  }
}
