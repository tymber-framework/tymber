import { Component, ConfigService, INJECT, createCookie } from "@tymber/common";
import { type AdminSessionId } from "../repositories/AdminUserRepository.js";

interface Config {
  ADMIN_COOKIE_MAX_AGE_IN_SECONDS: number;
}

export class AdminCookieService extends Component {
  static [INJECT] = [ConfigService];

  private config?: Config;

  constructor(configService: ConfigService) {
    super();
    configService.subscribe(
      [
        {
          key: "ADMIN_COOKIE_MAX_AGE_IN_SECONDS",
          type: "number",
          defaultValue: 60 * 60 * 24 * 365,
        },
      ],
      (config) => {
        this.config = config as Config;
      },
    );
  }

  public createCookie(sessionId: AdminSessionId, requestHeaders: Headers) {
    const isSameSiteRequest = !requestHeaders.has("origin");

    return createCookie("ssid", sessionId, {
      path: "/",
      httpOnly: true,
      sameSite: isSameSiteRequest ? "strict" : "lax",
      maxAge: this.config!.ADMIN_COOKIE_MAX_AGE_IN_SECONDS,
    });
  }
}
