import {
  ConfigService,
  type HttpContext,
  INJECT,
  Middleware,
} from "@tymber/core";

interface Config {
  CORS_ALLOW_ORIGINS: string[];
  CORS_ALLOW_CREDENTIALS: boolean;
  CORS_ALLOW_METHODS: string[];
  CORS_ALLOW_HEADERS: string[];
  CORS_MAX_AGE_IN_SECONDS: number;
}

function isOriginAllowed(origin: string, allowedOrigins: string[]) {
  return allowedOrigins.includes("*") || allowedOrigins.includes(origin);
}

/**
 * Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
 * Implementation reference: https://www.npmjs.com/package/cors
 */
export class CORS extends Middleware {
  // @ts-expect-error will be initialized by the ConfigService
  private config: Config;

  static [INJECT] = [ConfigService];

  constructor(configService: ConfigService) {
    super();
    configService.subscribe<Config>(
      {
        CORS_ALLOW_ORIGINS: {
          type: "array",
          items: {
            type: "string",
            format: "uri",
          },
          default: [],
        },
        CORS_ALLOW_CREDENTIALS: {
          type: "boolean",
          default: false,
        },
        CORS_ALLOW_METHODS: {
          type: "array",
          items: {
            type: "string",
            enum: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
          },
          default: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
        },
        CORS_ALLOW_HEADERS: {
          type: "array",
          items: {
            type: "string",
          },
          default: [],
        },
        CORS_MAX_AGE_IN_SECONDS: {
          type: "number",
          default: 5,
        },
      },
      (config) => {
        this.config = config;
      },
    );
  }

  async handle({ method, headers, responseHeaders }: HttpContext) {
    if (!headers.has("origin")) {
      return;
    }

    const isPreflight = method === "OPTIONS";
    if (isPreflight) {
      this._configureOrigin(headers, responseHeaders);
      this._configureCredentials(headers, responseHeaders);
      this._configureMethods(headers, responseHeaders);
      this._configureAllowedHeaders(headers, responseHeaders);
      this._configureMaxAge(headers, responseHeaders);
      this._configureExposedHeaders(headers, responseHeaders);

      return new Response(null, {
        status: 204,
      });
    } else {
      this._configureOrigin(headers, responseHeaders);
      this._configureCredentials(headers, responseHeaders);
      this._configureExposedHeaders(headers, responseHeaders);
    }
  }

  private _configureOrigin(requestHeaders: Headers, responseHeaders: Headers) {
    const origin = requestHeaders.get("origin") as string;

    const isAllowed = isOriginAllowed(origin, this.config.CORS_ALLOW_ORIGINS);

    responseHeaders.set(
      "access-control-allow-origin",
      isAllowed ? origin : "false",
    );
    responseHeaders.set("vary", "origin");
  }

  private _configureCredentials(
    _requestHeaders: Headers,
    responseHeaders: Headers,
  ) {
    if (this.config.CORS_ALLOW_CREDENTIALS) {
      responseHeaders.set("access-control-allow-credentials", "true");
    }
  }

  private _configureMethods(
    _requestHeaders: Headers,
    responseHeaders: Headers,
  ) {
    responseHeaders.set(
      "access-control-allow-methods",
      this.config.CORS_ALLOW_METHODS.join(","),
    );
  }

  private _configureAllowedHeaders(
    requestHeaders: Headers,
    responseHeaders: Headers,
  ) {
    responseHeaders.set(
      "access-control-allow-headers",
      [...this.config.CORS_ALLOW_HEADERS, "x-csrf-token"].join(","),
    );
  }

  private _configureMaxAge(requestHeaders: Headers, responseHeaders: Headers) {
    responseHeaders.set(
      "access-control-max-age",
      this.config.CORS_MAX_AGE_IN_SECONDS.toString(),
    );
  }

  private _configureExposedHeaders(
    requestHeaders: Headers,
    responseHeaders: Headers,
  ) {
    // TODO
  }
}
