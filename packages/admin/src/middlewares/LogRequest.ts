import {
  ConfigService,
  emptyContext,
  type HttpContext,
  INJECT,
  Middleware,
  randomUUID,
} from "@tymber/core";
import {
  IncomingRequestRepository,
  type IncomingRequest,
} from "../repositories/IncomingRequestRepository.js";

interface Config {
  ADMIN_INCOMING_REQUESTS_FLUSH_INTERVAL_IN_MS: number;
  ADMIN_INCOMING_REQUESTS_BUFFER_SIZE: number;
}

export class LogRequest extends Middleware {
  static [INJECT] = [IncomingRequestRepository, ConfigService];

  private buffer: Omit<IncomingRequest, "id">[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private config!: Config;

  constructor(
    private readonly adminIncomingRequestRepository: IncomingRequestRepository,
    configService: ConfigService,
  ) {
    super();
    configService.subscribe<Config>(
      {
        ADMIN_INCOMING_REQUESTS_FLUSH_INTERVAL_IN_MS: {
          type: "number",
          default: 10_000,
        },
        ADMIN_INCOMING_REQUESTS_BUFFER_SIZE: {
          type: "number",
          default: 100,
        },
      },
      (config) => {
        this.config = config;
        if (this.flushInterval) {
          clearInterval(this.flushInterval);
        }
        this.flushInterval = setInterval(
          () => this.flush(),
          this.config.ADMIN_INCOMING_REQUESTS_FLUSH_INTERVAL_IN_MS,
        );
      },
    );
  }

  override async close() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flush();
  }

  private isExcludedFromLogging(ctx: HttpContext) {
    return (
      ctx.path.startsWith("/static/") ||
      ctx.path === "/api/admin" ||
      ctx.path.startsWith("/api/admin/") ||
      ctx.path === "/admin" ||
      ctx.path.startsWith("/admin/")
    );
  }

  public handle(ctx: HttpContext): void {
    if (this.isExcludedFromLogging(ctx)) return;

    const requestId = randomUUID();
    const startedAt = Date.now();

    ctx.responseHeaders.set("x-request-id", requestId);

    ctx.onFinish((res) => {
      if (ctx.matchedRoute === undefined) {
        // routing is done after middlewares execution
        return;
      }

      const durationInMs = Date.now() - startedAt;
      this.buffer.push({
        createdAt: ctx.startedAt,
        requestId,
        method: ctx.method,
        path: ctx.path,
        matchedRoute: ctx.matchedRoute,
        userId: ctx.user?.id,
        status: res.status,
        durationInMs,
      });

      if (
        this.buffer.length >= this.config.ADMIN_INCOMING_REQUESTS_BUFFER_SIZE
      ) {
        void this.flush();
      }
    });
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const requests = [...this.buffer];
    this.buffer = [];

    try {
      await this.adminIncomingRequestRepository.log(emptyContext(), requests);
    } catch (e) {}
  }
}
