import {
  Component,
  ConfigService,
  INJECT,
  createCookie,
  isProduction,
} from "@tymber/core";
import type { SessionId } from "../repositories/SessionRepository.js";

interface Config {
  USER_COOKIE_MAX_AGE_IN_SECONDS: number;
  USER_COOKIE_SECURE_ATTRIBUTE: boolean;
  USER_COOKIE_SAME_SITE_ATTRIBUTE: "strict" | "lax" | "none";
}

export class CookieService extends Component {
  static [INJECT] = [ConfigService];

  // @ts-expect-error will be initialized by the ConfigService
  private config: Config;

  constructor(configService: ConfigService) {
    super();
    configService.subscribe<Config>(
      {
        USER_COOKIE_MAX_AGE_IN_SECONDS: {
          type: "number",
          default: 60 * 60 * 24 * 365,
        },
        USER_COOKIE_SECURE_ATTRIBUTE: {
          type: "boolean",
          default: isProduction,
        },
        USER_COOKIE_SAME_SITE_ATTRIBUTE: {
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

  public createCookie(sessionId: SessionId) {
    return createCookie("sid", sessionId, {
      path: "/",
      httpOnly: true,
      secure: this.config.USER_COOKIE_SECURE_ATTRIBUTE,
      sameSite: this.config.USER_COOKIE_SAME_SITE_ATTRIBUTE,
      maxAge: this.config.USER_COOKIE_MAX_AGE_IN_SECONDS,
    });
  }

  public createExpiredCookie() {
    return createCookie("sid", "", {
      path: "/",
      httpOnly: true,
      secure: this.config.USER_COOKIE_SECURE_ATTRIBUTE,
      sameSite: this.config.USER_COOKIE_SAME_SITE_ATTRIBUTE,
      maxAge: 0,
    });
  }
}
