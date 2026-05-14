import {
  Component,
  ConfigService,
  type Context,
  createDebug,
  emptyContext,
  INJECT,
} from "@tymber/core";
import {
  type AdminSessionId,
  AdminUserRepository,
} from "../repositories/AdminUserRepository.js";
import { type AdminUserId } from "@tymber/core";

const debug = createDebug("AdminUserService");

interface Config {
  ADMIN_COOKIE_MAX_AGE_IN_SECONDS: number;
}

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

export class AdminUserService extends Component {
  static [INJECT] = [ConfigService, AdminUserRepository];

  // @ts-expect-error will be initialized by the ConfigService
  private config: Config;

  private timerId?: NodeJS.Timeout;

  constructor(
    configService: ConfigService,
    private readonly adminUserRepository: AdminUserRepository,
  ) {
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

  override init() {
    this.timerId = setInterval(async () => {
      try {
        debug("deleting expired sessions");
        await this.adminUserRepository.deleteExpiredSessions(emptyContext());
      } catch (e) {
        debug("error deleting expired sessions: %s", (e as Error).message);
      }
    }, ONE_HOUR_IN_MS);
  }

  override close(): void | Promise<void> {
    clearInterval(this.timerId);
  }

  public async createSession(
    ctx: Context,
    adminUserId: AdminUserId,
  ): Promise<AdminSessionId> {
    const expiresAt = new Date(
      Date.now() + this.config.ADMIN_COOKIE_MAX_AGE_IN_SECONDS * 1000,
    );

    return this.adminUserRepository.createSession(ctx, adminUserId, expiresAt);
  }
}
