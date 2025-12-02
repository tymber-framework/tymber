import { AdminEndpoint, type HttpContext } from "@tymber/common";

export class GetSelf extends AdminEndpoint {
  override handle({ admin }: HttpContext) {
    return Response.json({
      id: admin?.id,
    });
  }
}
