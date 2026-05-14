import {
  type HttpContext,
  INJECT,
  Middleware,
  createCookie,
} from "@tymber/core";
import {
  type AdminSessionId,
  AdminUserRepository,
} from "../repositories/AdminUserRepository.js";
import { AdminCookieService } from "../services/AdminCookieService.js";

export class ParseAdminSession extends Middleware {
  static [INJECT] = [AdminUserRepository, AdminCookieService];

  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly adminCookieService: AdminCookieService,
  ) {
    super();
  }

  override async handle(ctx: HttpContext) {
    const adminSessionId = ctx.cookies["ssid"];

    if (!adminSessionId) {
      return;
    }

    const admin = await this.adminUserRepository.findBySessionId(
      ctx,
      adminSessionId as AdminSessionId,
    );

    if (admin) {
      ctx.adminSessionId = adminSessionId;
      ctx.admin = admin;
    } else {
      ctx.responseHeaders.append(
        "set-cookie",
        this.adminCookieService.createExpiredCookie(),
      );
    }
  }
}
