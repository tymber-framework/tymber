import { type HttpContext, Middleware } from "@tymber/common";

/**
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#employing-custom-request-headers-for-ajaxapi
 */
export class CSRF extends Middleware {
  handle({ headers }: HttpContext) {
    if (headers.has("origin") && !headers.has("x-csrf-token")) {
      // TODO report error

      return Response.json(
        {
          message: "missing CSRF header",
        },
        { status: 403 },
      );
    }
  }
}
