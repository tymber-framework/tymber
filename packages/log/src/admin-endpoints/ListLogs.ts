import { AdminEndpoint, type HttpContext, INJECT } from "@tymber/core";
import { type JSONSchemaType } from "ajv";
import {
  DBLogService,
  type LogLevelAsString,
} from "../services/DBLogService.js";

interface ListLogsQuery {
  levels?: LogLevelAsString[];
  components?: string[];
  from?: string;
  to?: string;
  page: number;
  size: number;
  sort: "created_at:asc" | "created_at:desc";
}

export class ListLogs extends AdminEndpoint {
  static [INJECT] = [DBLogService];

  constructor(private readonly logService: DBLogService) {
    super();
  }

  querySchema: JSONSchemaType<ListLogsQuery> = {
    type: "object",
    properties: {
      levels: {
        type: "array",
        items: { type: "string", enum: ["debug", "info", "warn", "error"] },
        nullable: true,
      },
      components: { type: "array", items: { type: "string" }, nullable: true },
      from: { type: "string", format: "date-time", nullable: true },
      to: { type: "string", format: "date-time", nullable: true },
      page: { type: "integer", minimum: 1, maximum: 100, default: 1 },
      size: { type: "integer", minimum: 1, maximum: 500, default: 50 },
      sort: {
        type: "string",
        enum: ["created_at:asc", "created_at:desc"],
        default: "created_at:asc",
      },
    },
    required: [],
  };

  override async handle(ctx: HttpContext<never, never, ListLogsQuery>) {
    const { query } = ctx;

    const output = await this.logService.listLogs(ctx, {
      ...query,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });

    return Response.json(output);
  }
}
