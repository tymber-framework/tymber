import {
  Component,
  ConfigService,
  type Context,
  emptyContext,
  INJECT,
  type Result,
  randomUUID,
} from "@tymber/core";
import {
  OutgoingRequestRepository,
  type OutgoingRequest,
} from "../repositories/OutgoingRequestRepository.js";
import {
  parseSetCookieHeader,
  type SetCookie,
} from "../utils/parseSetCookieHeader.js";

interface Config {
  ADMIN_OUTGOING_REQUESTS_FLUSH_INTERVAL_IN_MS: number;
  ADMIN_OUTGOING_REQUESTS_BUFFER_SIZE: number;
}

export interface HttpResponse<T> {
  status: number;
  headers: Headers;
  body: T;
}

export interface HttpClientError {
  status: number;
  wrappedError?: Error;
  headers?: Headers;
  body?: unknown;
}

export class HttpClient extends Component {
  static [INJECT] = [OutgoingRequestRepository, ConfigService];

  private cookiesByOrigin: Map<string, Map<string, SetCookie>> = new Map();
  private buffer: Omit<OutgoingRequest, "id">[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private config!: Config;

  constructor(
    private readonly adminOutgoingRequestRepository: OutgoingRequestRepository,
    configService: ConfigService,
  ) {
    super();
    configService.subscribe<Config>(
      {
        ADMIN_OUTGOING_REQUESTS_FLUSH_INTERVAL_IN_MS: {
          type: "number",
          default: 10_000,
        },
        ADMIN_OUTGOING_REQUESTS_BUFFER_SIZE: {
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
          this.config.ADMIN_OUTGOING_REQUESTS_FLUSH_INTERVAL_IN_MS,
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

  public async fetch<T>(
    _ctx: Context,
    url: string,
    options: RequestInit = {},
  ): Promise<Result<HttpResponse<T>, HttpClientError>> {
    const requestId = randomUUID();
    const method = options.method || "GET";
    const startedAt = new Date();

    const headers = new Headers(options.headers);

    headers.set("x-request-id", requestId);
    // TODO add x-correlation-id

    const parsedUrl = new URL(url);
    const cookies = this.computeCookiesToSend(parsedUrl.origin, startedAt);

    if (cookies) {
      headers.set("cookie", cookies);
    }

    const durationInMs = Date.now() - startedAt.getTime();

    const res = await this.doFetch<T>(parsedUrl, {
      ...options,
      headers,
    });

    const status = res.ok ? res.value.status : res.reason.status;

    this.buffer.push({
      createdAt: startedAt,
      requestId,
      method: method.toUpperCase(),
      origin: parsedUrl.origin,
      path: parsedUrl.pathname,
      status,
      durationInMs,
    });

    if (this.buffer.length >= this.config.ADMIN_OUTGOING_REQUESTS_BUFFER_SIZE) {
      void this.flush();
    }

    return res;
  }

  private computeCookiesToSend(origin: string, startedAt: Date) {
    const cookies = this.cookiesByOrigin.get(origin);

    if (cookies && cookies.size > 0) {
      const cookiesToSend: string[] = [];
      const cookiesToRemove: string[] = [];

      for (const [_, entry] of cookies.entries()) {
        if (entry.expires && entry.expires < startedAt) {
          cookiesToRemove.push(entry.name);
        } else {
          cookiesToSend.push(`${entry.name}=${entry.value}`);
        }
      }

      for (const name of cookiesToRemove) {
        cookies.delete(name);
      }

      if (cookiesToSend.length > 0) {
        return cookiesToSend.join("; ");
      }
    }
  }

  private async doFetch<T>(
    url: URL,
    options: RequestInit,
  ): Promise<Result<HttpResponse<T>, HttpClientError>> {
    let res: Response;

    try {
      res = await fetch(url, options);
    } catch (e) {
      // network error
      return {
        ok: false,
        reason: {
          wrappedError: e as Error,
          status: -1,
        },
      };
    }

    const setCookie = res.headers.getSetCookie();
    if (setCookie.length > 0) {
      for (const cookieHeader of setCookie) {
        const parsedCookie = parseSetCookieHeader(cookieHeader);
        if (!this.cookiesByOrigin.has(url.origin)) {
          this.cookiesByOrigin.set(url.origin, new Map());
        }
        if (parsedCookie.maxAge !== undefined) {
          // max-age takes precedence
          parsedCookie.expires = new Date(
            Date.now() + parsedCookie.maxAge * 1000,
          );
        }
        this.cookiesByOrigin
          .get(url.origin)!
          .set(parsedCookie.name, parsedCookie);
      }
    }

    let body: unknown;

    try {
      body = await this.readBody(res);
    } catch (e) {
      return {
        ok: false,
        reason: {
          wrappedError: e as Error,
          status: res.status,
          headers: res.headers,
        },
      };
    }

    if (res.ok) {
      return {
        ok: true,
        value: {
          status: res.status,
          headers: res.headers,
          body: body as T,
        },
      };
    } else {
      return {
        ok: false,
        reason: {
          status: res.status,
          headers: res.headers,
          body: body,
        },
      };
    }
  }

  private readBody(res: Response) {
    const contentType = res.headers.get("content-type");

    if (contentType) {
      const mediaType = contentType.split(";")[0]?.trim().toLowerCase();

      if (mediaType === "application/json") {
        return res.json();
      } else {
        return res.bytes();
      }
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const requests = [...this.buffer];
    this.buffer = [];

    try {
      await this.adminOutgoingRequestRepository.log(emptyContext(), requests);
    } catch (e) {}
  }

  public clearCookies() {
    this.cookiesByOrigin.clear();
  }
}
