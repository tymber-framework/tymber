import { AdminEndpoint, type HttpContext } from "@tymber/core";

export class GetSelf extends AdminEndpoint {
  override handle({ admin }: HttpContext) {
    return Response.json({
      id: admin?.id,
    });
  }
}
