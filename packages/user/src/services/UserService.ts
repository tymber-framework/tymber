import {
  Component,
  ConfigService,
  type Context,
  createDebug,
  emptyContext,
  INJECT,
  randomUUID,
} from "@tymber/core";
import {
  type SessionId,
  SessionRepository,
} from "../repositories/SessionRepository.js";
import type { User } from "../repositories/UserRepository.js";

const debug = createDebug("UserService");

interface Config {
  USER_COOKIE_MAX_AGE_IN_SECONDS: number;
}

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

export class UserService extends Component {
  static [INJECT] = [ConfigService, SessionRepository];

  // @ts-expect-error will be initialized by the ConfigService
  private config: Config;

  private timerId?: NodeJS.Timeout;

  constructor(
    configService: ConfigService,
    private readonly sessionRepository: SessionRepository,
  ) {
    super();
    configService.subscribe<Config>(
      {
        USER_COOKIE_MAX_AGE_IN_SECONDS: {
          type: "number",
          default: 60 * 60 * 24 * 365,
        },
      },
      (config) => {
        this.config = config;
      },
    );
  }

  override async init() {
    let running = false;

    this.timerId = setInterval(async () => {
      if (running) return;
      running = true;
      try {
        debug("deleting expired sessions");
        await this.sessionRepository.deleteExpiredSessions(emptyContext());
      } catch (e) {
        debug("error deleting expired sessions: %s", (e as Error).message);
      } finally {
        running = false;
      }
    }, ONE_HOUR_IN_MS);

    await this.sessionRepository.deleteExpiredSessions(emptyContext());
  }

  override close(): void | Promise<void> {
    clearInterval(this.timerId);
  }

  public async createSession(ctx: Context, user: User): Promise<SessionId> {
    const sessionId = randomUUID() as SessionId;

    const expiresAt = new Date(
      Date.now() + this.config.USER_COOKIE_MAX_AGE_IN_SECONDS * 1000,
    );

    await this.sessionRepository.insert(ctx, {
      id: sessionId,
      userId: user.internalId,
      expiresAt,
    });

    return sessionId;
  }
}
