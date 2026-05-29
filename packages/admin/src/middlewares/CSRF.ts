import { computeBaseUrl, type HttpContext, Middleware } from "@tymber/core";

/**
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#employing-custom-request-headers-for-ajaxapi
 * @see https://pkg.go.dev/net/http#CrossOriginProtection
 */
export class CSRF extends Middleware {
  handle(ctx: HttpContext) {
    if (
      isUnsafeMethod(ctx) &&
      isCrossSiteRequest(ctx) &&
      isMissingCustomHeader(ctx)
    ) {
      return Response.json(
        {
          message: "missing CSRF header",
        },
        { status: 403 },
      );
    }
  }
}

function isUnsafeMethod({ method }: HttpContext) {
  return !["GET", "HEAD", "OPTIONS"].includes(method);
}

function isCrossSiteRequest({ headers }: HttpContext) {
  const secFetchSite = headers.get("sec-fetch-site");

  if (secFetchSite) {
    return !["same-origin", "same-site", "none"].includes(secFetchSite);
  }

  const origin = headers.get("origin");

  if (origin) {
    try {
      return new URL(origin).origin !== new URL(computeBaseUrl(headers)).origin;
    } catch {
      return true;
    }
  }

  return false;
}

function isMissingCustomHeader({ headers }: HttpContext) {
  return !headers.has("x-csrf-token");
}
