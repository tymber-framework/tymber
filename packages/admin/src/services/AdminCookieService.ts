import {
  Component,
  ConfigService,
  INJECT,
  createCookie,
  isProduction,
} from "@tymber/core";
import { type AdminSessionId } from "../repositories/AdminUserRepository.js";

interface Config {
  ADMIN_COOKIE_MAX_AGE_IN_SECONDS: number;
}

export class AdminCookieService extends Component {
  static [INJECT] = [ConfigService];

  // @ts-expect-error will be initialized by the ConfigService
  private config: Config;

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
      secure: isProduction,
      sameSite: isSameSiteRequest ? "strict" : "lax",
      maxAge: this.config.ADMIN_COOKIE_MAX_AGE_IN_SECONDS,
    });
  }

  public createExpiredCookie(requestHeaders: Headers) {
    const isSameSiteRequest = !requestHeaders.has("origin");

    return createCookie("ssid", "", {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: isSameSiteRequest ? "strict" : "lax",
      maxAge: 0,
    });
  }
}
