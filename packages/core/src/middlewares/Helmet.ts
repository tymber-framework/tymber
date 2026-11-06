import { Middleware } from "../Middleware.js";
import { INJECT } from "../Component.js";
import { ConfigService } from "../ConfigService.js";
import { type HttpContext } from "../HttpContext.js";

interface Config {
  // Content-Security-Policy
  HELMET_CONTENT_SECURITY_POLICY_ENABLED: boolean;

  HELMET_CSP_DEFAULT_SRC: string[];
  HELMET_CSP_BASE_URI: string[];
  HELMET_CSP_FONT_SRC: string[];
  HELMET_CSP_FORM_ACTION: string[];
  HELMET_CSP_FRAME_ANCESTORS: string[];
  HELMET_CSP_IMG_SRC: string[];
  HELMET_CSP_OBJECT_SRC: string[];
  HELMET_CSP_SCRIPT_SRC: string[];
  HELMET_CSP_SCRIPT_SRC_ATTR: string[];
  HELMET_CSP_STYLE_SRC: string[];
  HELMET_CSP_UPGRADE_INSECURE_REQUESTS: boolean;

  // Cross-Origin-Embedder-Policy
  HELMET_CROSS_ORIGIN_EMBEDDER_POLICY_ENABLED: boolean;
  HELMET_CROSS_ORIGIN_EMBEDDER_POLICY:
    | "require-corp"
    | "credentialless"
    | "unsafe-none";

  // Cross-Origin-Opener-Policy
  HELMET_CROSS_ORIGIN_OPENER_POLICY_ENABLED: boolean;
  HELMET_CROSS_ORIGIN_OPENER_POLICY:
    | "unsafe-none"
    | "same-origin-allow-popups"
    | "same-origin";

  // Cross-Origin-Resource-Policy
  HELMET_CROSS_ORIGIN_RESOURCE_POLICY_ENABLED: boolean;
  HELMET_CROSS_ORIGIN_RESOURCE_POLICY:
    | "same-site"
    | "same-origin"
    | "cross-origin";

  // Origin-Agent-Cluster
  HELMET_ORIGIN_AGENT_CLUSTER_ENABLED: boolean;

  // X-DNS-Prefetch-Control
  HELMET_DNS_PREFETCH_CONTROL_ENABLED: boolean;
  HELMET_DNS_PREFETCH_CONTROL_ALLOW: boolean;

  // X-Frame-Options
  HELMET_FRAME_OPTIONS_ENABLED: boolean;
  HELMET_FRAME_OPTIONS_ACTION: "deny" | "sameorigin";

  // X-Powered-By
  HELMET_HIDE_POWERED_BY_ENABLED: boolean;

  // Strict-Transport-Security
  HELMET_HSTS_ENABLED: boolean;
  HELMET_HSTS_MAX_AGE: number;
  HELMET_HSTS_INCLUDE_SUBDOMAINS: boolean;
  HELMET_HSTS_PRELOAD: boolean;

  // X-Download-Options
  HELMET_IENOOPEN_ENABLED: boolean;

  // X-Content-Type-Options
  HELMET_NOSNIFF_ENABLED: boolean;

  // X-Permitted-Cross-Domain-Policies
  HELMET_PERMITTED_CROSS_DOMAIN_POLICIES_ENABLED: boolean;
  HELMET_PERMITTED_CROSS_DOMAIN_POLICIES:
    | "none"
    | "master-only"
    | "by-content-type"
    | "by-ftp-filename"
    | "all";

  // Referrer-Policy
  HELMET_REFERRER_POLICY_ENABLED: boolean;
  HELMET_REFERRER_POLICY:
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "same-origin"
    | "origin"
    | "strict-origin"
    | "origin-when-cross-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url";

  // X-XSS-Protection
  HELMET_XSS_FILTER_ENABLED: boolean;
}

/**
 * Middleware based on helmet: https://www.npmjs.com/package/helmet
 *
 * Default values match v8.3.0 defaults
 */
export class Helmet extends Middleware {
  // @ts-expect-error will be initialized by the ConfigService
  private config: Config;

  static [INJECT] = [ConfigService];

  constructor(configService: ConfigService) {
    super();
    configService.subscribe<Config>(
      {
        HELMET_CONTENT_SECURITY_POLICY_ENABLED: {
          type: "boolean",
          default: true,
        },
        HELMET_CSP_DEFAULT_SRC: {
          type: "array",
          items: { type: "string" },
          default: ["'self'"],
        },
        HELMET_CSP_BASE_URI: {
          type: "array",
          items: { type: "string" },
          default: ["'self'"],
        },
        HELMET_CSP_FONT_SRC: {
          type: "array",
          items: { type: "string" },
          default: ["'self'", "https:", "data:"],
        },
        HELMET_CSP_FORM_ACTION: {
          type: "array",
          items: { type: "string" },
          default: ["'self'"],
        },
        HELMET_CSP_FRAME_ANCESTORS: {
          type: "array",
          items: { type: "string" },
          default: ["'self'"],
        },
        HELMET_CSP_IMG_SRC: {
          type: "array",
          items: { type: "string" },
          default: ["'self'", "data:"],
        },
        HELMET_CSP_OBJECT_SRC: {
          type: "array",
          items: { type: "string" },
          default: ["'none'"],
        },
        HELMET_CSP_SCRIPT_SRC: {
          type: "array",
          items: { type: "string" },
          default: ["'self'"],
        },
        HELMET_CSP_SCRIPT_SRC_ATTR: {
          type: "array",
          items: { type: "string" },
          default: ["'none'"],
        },
        HELMET_CSP_STYLE_SRC: {
          type: "array",
          items: { type: "string" },
          default: ["'self'", "https:", "'unsafe-inline'"],
        },
        HELMET_CSP_UPGRADE_INSECURE_REQUESTS: {
          type: "boolean",
          default: true,
        },

        HELMET_CROSS_ORIGIN_EMBEDDER_POLICY_ENABLED: {
          type: "boolean",
          default: false,
        },
        HELMET_CROSS_ORIGIN_EMBEDDER_POLICY: {
          type: "string",
          enum: ["require-corp", "credentialless", "unsafe-none"],
          default: "require-corp",
        },

        HELMET_CROSS_ORIGIN_OPENER_POLICY_ENABLED: {
          type: "boolean",
          default: true,
        },
        HELMET_CROSS_ORIGIN_OPENER_POLICY: {
          type: "string",
          enum: ["unsafe-none", "same-origin-allow-popups", "same-origin"],
          default: "same-origin",
        },

        HELMET_CROSS_ORIGIN_RESOURCE_POLICY_ENABLED: {
          type: "boolean",
          default: true,
        },
        HELMET_CROSS_ORIGIN_RESOURCE_POLICY: {
          type: "string",
          enum: ["same-site", "same-origin", "cross-origin"],
          default: "same-origin",
        },

        HELMET_ORIGIN_AGENT_CLUSTER_ENABLED: {
          type: "boolean",
          default: true,
        },

        HELMET_DNS_PREFETCH_CONTROL_ENABLED: {
          type: "boolean",
          default: true,
        },
        HELMET_DNS_PREFETCH_CONTROL_ALLOW: {
          type: "boolean",
          default: false,
        },

        HELMET_FRAME_OPTIONS_ENABLED: {
          type: "boolean",
          default: true,
        },
        HELMET_FRAME_OPTIONS_ACTION: {
          type: "string",
          enum: ["deny", "sameorigin"],
          default: "sameorigin",
        },

        HELMET_HIDE_POWERED_BY_ENABLED: {
          type: "boolean",
          default: true,
        },

        HELMET_HSTS_ENABLED: {
          type: "boolean",
          default: true,
        },
        HELMET_HSTS_MAX_AGE: {
          type: "number",
          default: 31536000, // 365 days in seconds
        },
        HELMET_HSTS_INCLUDE_SUBDOMAINS: {
          type: "boolean",
          default: true,
        },
        HELMET_HSTS_PRELOAD: {
          type: "boolean",
          default: false,
        },

        HELMET_IENOOPEN_ENABLED: {
          type: "boolean",
          default: true,
        },

        HELMET_NOSNIFF_ENABLED: {
          type: "boolean",
          default: true,
        },

        HELMET_PERMITTED_CROSS_DOMAIN_POLICIES_ENABLED: {
          type: "boolean",
          default: true,
        },
        HELMET_PERMITTED_CROSS_DOMAIN_POLICIES: {
          type: "string",
          enum: [
            "none",
            "master-only",
            "by-content-type",
            "by-ftp-filename",
            "all",
          ],
          default: "none",
        },

        HELMET_REFERRER_POLICY_ENABLED: {
          type: "boolean",
          default: true,
        },
        HELMET_REFERRER_POLICY: {
          type: "string",
          enum: [
            "no-referrer",
            "no-referrer-when-downgrade",
            "same-origin",
            "origin",
            "strict-origin",
            "origin-when-cross-origin",
            "strict-origin-when-cross-origin",
            "unsafe-url",
          ],
          default: "no-referrer",
        },

        HELMET_XSS_FILTER_ENABLED: {
          type: "boolean",
          default: true,
        },
      },
      (config) => {
        this.config = config;
      },
    );
  }

  async handle({ responseHeaders }: HttpContext) {
    if (this.config.HELMET_HIDE_POWERED_BY_ENABLED) {
      responseHeaders.delete("x-powered-by");
    }

    if (this.config.HELMET_FRAME_OPTIONS_ENABLED) {
      responseHeaders.set(
        "x-frame-options",
        this.config.HELMET_FRAME_OPTIONS_ACTION.toUpperCase(),
      );
    }

    if (this.config.HELMET_NOSNIFF_ENABLED) {
      responseHeaders.set("x-content-type-options", "nosniff");
    }

    // ieNoOpen
    if (this.config.HELMET_IENOOPEN_ENABLED) {
      responseHeaders.set("x-download-options", "noopen");
    }

    // originAgentCluster
    if (this.config.HELMET_ORIGIN_AGENT_CLUSTER_ENABLED) {
      responseHeaders.set("origin-agent-cluster", "?1");
    }

    // dnsPrefetchControl
    if (this.config.HELMET_DNS_PREFETCH_CONTROL_ENABLED) {
      const allow = this.config.HELMET_DNS_PREFETCH_CONTROL_ALLOW;
      responseHeaders.set("x-dns-prefetch-control", allow ? "on" : "off");
    }

    // referrerPolicy
    if (this.config.HELMET_REFERRER_POLICY_ENABLED) {
      responseHeaders.set(
        "referrer-policy",
        this.config.HELMET_REFERRER_POLICY,
      );
    }

    // permittedCrossDomainPolicies
    if (this.config.HELMET_PERMITTED_CROSS_DOMAIN_POLICIES_ENABLED) {
      responseHeaders.set(
        "x-permitted-cross-domain-policies",
        this.config.HELMET_PERMITTED_CROSS_DOMAIN_POLICIES,
      );
    }

    // crossOriginEmbedderPolicy
    if (this.config.HELMET_CROSS_ORIGIN_EMBEDDER_POLICY_ENABLED) {
      responseHeaders.set(
        "cross-origin-embedder-policy",
        this.config.HELMET_CROSS_ORIGIN_EMBEDDER_POLICY,
      );
    }

    // crossOriginOpenerPolicy
    if (this.config.HELMET_CROSS_ORIGIN_OPENER_POLICY_ENABLED) {
      responseHeaders.set(
        "cross-origin-opener-policy",
        this.config.HELMET_CROSS_ORIGIN_OPENER_POLICY,
      );
    }

    // crossOriginResourcePolicy
    if (this.config.HELMET_CROSS_ORIGIN_RESOURCE_POLICY_ENABLED) {
      responseHeaders.set(
        "cross-origin-resource-policy",
        this.config.HELMET_CROSS_ORIGIN_RESOURCE_POLICY,
      );
    }

    // hsts (strict-transport-security)
    if (this.config.HELMET_HSTS_ENABLED) {
      const maxAge = this.config.HELMET_HSTS_MAX_AGE;
      const includeSubDomains = this.config.HELMET_HSTS_INCLUDE_SUBDOMAINS
        ? "; includeSubDomains"
        : "";
      const preload = this.config.HELMET_HSTS_PRELOAD ? "; preload" : "";
      responseHeaders.set(
        "strict-transport-security",
        `max-age=${maxAge}${includeSubDomains}${preload}`,
      );
    }

    // contentSecurityPolicy - enabled by default in helmet v8
    // Build CSP from individual directives
    if (this.config.HELMET_CONTENT_SECURITY_POLICY_ENABLED) {
      const directives: string[] = [];

      // Add each directive only if it has values
      if (this.config.HELMET_CSP_DEFAULT_SRC.length > 0) {
        directives.push(
          `default-src ${this.config.HELMET_CSP_DEFAULT_SRC.join(" ")}`,
        );
      }
      if (this.config.HELMET_CSP_BASE_URI.length > 0) {
        directives.push(
          `base-uri ${this.config.HELMET_CSP_BASE_URI.join(" ")}`,
        );
      }
      if (this.config.HELMET_CSP_FONT_SRC.length > 0) {
        directives.push(
          `font-src ${this.config.HELMET_CSP_FONT_SRC.join(" ")}`,
        );
      }
      if (this.config.HELMET_CSP_FORM_ACTION.length > 0) {
        directives.push(
          `form-action ${this.config.HELMET_CSP_FORM_ACTION.join(" ")}`,
        );
      }
      if (this.config.HELMET_CSP_FRAME_ANCESTORS.length > 0) {
        directives.push(
          `frame-ancestors ${this.config.HELMET_CSP_FRAME_ANCESTORS.join(" ")}`,
        );
      }
      if (this.config.HELMET_CSP_IMG_SRC.length > 0) {
        directives.push(`img-src ${this.config.HELMET_CSP_IMG_SRC.join(" ")}`);
      }
      if (this.config.HELMET_CSP_OBJECT_SRC.length > 0) {
        directives.push(
          `object-src ${this.config.HELMET_CSP_OBJECT_SRC.join(" ")}`,
        );
      }
      if (this.config.HELMET_CSP_SCRIPT_SRC.length > 0) {
        directives.push(
          `script-src ${this.config.HELMET_CSP_SCRIPT_SRC.join(" ")}`,
        );
      }
      if (this.config.HELMET_CSP_SCRIPT_SRC_ATTR.length > 0) {
        directives.push(
          `script-src-attr ${this.config.HELMET_CSP_SCRIPT_SRC_ATTR.join(" ")}`,
        );
      }
      if (this.config.HELMET_CSP_STYLE_SRC.length > 0) {
        directives.push(
          `style-src ${this.config.HELMET_CSP_STYLE_SRC.join(" ")}`,
        );
      }
      if (this.config.HELMET_CSP_UPGRADE_INSECURE_REQUESTS) {
        directives.push("upgrade-insecure-requests");
      }

      if (directives.length > 0) {
        responseHeaders.set("content-security-policy", directives.join("; "));
      }
    }

    // xssFilter - helmet v8 sets X-XSS-Protection to "0" by default
    if (this.config.HELMET_XSS_FILTER_ENABLED) {
      responseHeaders.set("x-xss-protection", "0");
    }
  }
}
