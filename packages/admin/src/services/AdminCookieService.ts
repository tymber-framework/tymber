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
  ADMIN_COOKIE_SECURE_ATTRIBUTE: boolean;
  ADMIN_COOKIE_SAME_SITE_ATTRIBUTE: "strict" | "lax" | "none";
}

export class AdminCookieService extends Component {
  static [INJECT] = [ConfigService];

  // @ts-expect-error will be initialized by the ConfigService
  private config: Config;

  constructor(configService: ConfigService) {
    super();
    configService.subscribe<Config>(
      {
        ADMIN_COOKIE_MAX_AGE_IN_SECONDS: {
          type: "number",
          default: 60 * 60 * 24 * 365,
        },
        ADMIN_COOKIE_SECURE_ATTRIBUTE: {
          type: "boolean",
          default: isProduction,
        },
        ADMIN_COOKIE_SAME_SITE_ATTRIBUTE: {
          type: "string",
          default: "strict",
          enum: ["strict", "lax", "none"],
        },
      },
      (config) => {
        this.config = config;
      },
    );
  }

  public createCookie(sessionId: AdminSessionId) {
    return createCookie("ssid", sessionId, {
      path: "/",
      httpOnly: true,
      secure: this.config.ADMIN_COOKIE_SECURE_ATTRIBUTE,
      sameSite: this.config.ADMIN_COOKIE_SAME_SITE_ATTRIBUTE,
      maxAge: this.config.ADMIN_COOKIE_MAX_AGE_IN_SECONDS,
    });
  }

  public createExpiredCookie() {
    return createCookie("ssid", "", {
      path: "/",
      httpOnly: true,
      secure: this.config.ADMIN_COOKIE_SECURE_ATTRIBUTE,
      sameSite: this.config.ADMIN_COOKIE_SAME_SITE_ATTRIBUTE,
      maxAge: 0,
    });
  }
}
