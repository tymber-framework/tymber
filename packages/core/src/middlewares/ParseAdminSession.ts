import {
  type HttpContext,
  INJECT,
  Middleware,
  createCookie,
} from "@tymber/common";
import {
  type AdminSessionId,
  AdminUserRepository,
} from "../repositories/AdminUserRepository.js";

export class ParseAdminSession extends Middleware {
  static [INJECT] = [AdminUserRepository];

  constructor(private readonly adminUserRepository: AdminUserRepository) {
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
        createCookie("ssid", "", {
          path: "/",
          httpOnly: true,
          maxAge: 0,
        }),
      );
    }
  }
}
