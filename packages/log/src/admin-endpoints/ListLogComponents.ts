import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/core";
import { DBLogService } from "../services/DBLogService.js";

export class ListLogComponents extends AdminEndpoint {
  static [INJECT] = [DBLogService];

  constructor(private readonly logService: DBLogService) {
    super();
  }

  override handle(ctx: HttpContext) {
    const items = this.logService.listComponents();

    return Response.json({
      items,
    });
  }
}
