import {
  type AdminSessionId,
  AdminUserRepository,
} from "../repositories/AdminUserRepository.js";
import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/core";
import { AdminCookieService } from "../services/AdminCookieService.js";

export class LogOut extends AdminEndpoint {
  static [INJECT] = [AdminUserRepository, AdminCookieService];

  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly adminCookieService: AdminCookieService,
  ) {
    super();
  }

  override async handle(ctx: HttpContext) {
    const { adminSessionId } = ctx;

    if (adminSessionId) {
      await this.adminUserRepository.deleteSession(
        ctx,
        adminSessionId as AdminSessionId,
      );
    }

    return new Response(null, {
      status: 204,
      headers: {
        "set-cookie": this.adminCookieService.createExpiredCookie(),
      },
    });
  }
}
