import {
  type AdminSessionId,
  AdminUserRepository,
} from "../repositories/AdminUserRepository.js";
import {
  AdminEndpoint,
  createCookie,
  type HttpContext,
  INJECT,
} from "@tymber/common";

export class LogOut extends AdminEndpoint {
  static [INJECT] = [AdminUserRepository];

  constructor(private readonly adminUserRepository: AdminUserRepository) {
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
        "set-cookie": createCookie("ssid", "", {
          path: "/",
          httpOnly: true,
          maxAge: 0,
        }),
      },
    });
  }
}
