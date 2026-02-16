import {
  ConfigService,
  type HttpContext,
  INJECT,
  Middleware,
} from "@tymber/common";

interface CorsOptions {
  CORS_ALLOW_ORIGINS: string[];
  CORS_ALLOW_CREDENTIALS: boolean;
  CORS_ALLOW_METHODS: string[];
  CORS_ALLOW_HEADERS: string[];
  CORS_MAX_AGE: number;
}

function isOriginAllowed(origin: string, allowedOrigins: string[]) {
  return allowedOrigins.includes("*") || allowedOrigins.includes(origin);
}

/**
 * Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
 * Implementation reference: https://www.npmjs.com/package/cors
 */
export class CORS extends Middleware {
  private cors?: CorsOptions;

  static [INJECT] = [ConfigService];

  constructor(configService: ConfigService) {
    super();
    configService.subscribe(
      [
        {
          key: "CORS_ALLOW_ORIGINS",
          type: "string[]",
          defaultValue: [],
        },
        {
          key: "CORS_ALLOW_CREDENTIALS",
          type: "boolean",
          defaultValue: false,
        },
        {
          key: "CORS_ALLOW_METHODS",
          type: "string[]",
          defaultValue: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
        },
        {
          key: "CORS_ALLOW_HEADERS",
          type: "string[]",
          defaultValue: [],
        },
        {
          key: "CORS_MAX_AGE_IN_SECONDS",
          type: "number",
          defaultValue: 5,
        },
      ],
      (newValue) => {
        this.cors = newValue as CorsOptions;
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

    const isAllowed = isOriginAllowed(
      origin,
      this.cors?.["CORS_ALLOW_ORIGINS"] as string[],
    );

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
    if (this.cors?.["CORS_ALLOW_CREDENTIALS"]) {
      responseHeaders.set("access-control-allow-credentials", "true");
    }
  }

  private _configureMethods(
    _requestHeaders: Headers,
    responseHeaders: Headers,
  ) {
    responseHeaders.set(
      "access-control-allow-methods",
      this.cors!["CORS_ALLOW_METHODS"].join(","),
    );
  }

  private _configureAllowedHeaders(
    requestHeaders: Headers,
    responseHeaders: Headers,
  ) {
    // TODO
  }

  private _configureMaxAge(requestHeaders: Headers, responseHeaders: Headers) {}

  private _configureExposedHeaders(
    requestHeaders: Headers,
    responseHeaders: Headers,
  ) {
    // TODO
  }
}
