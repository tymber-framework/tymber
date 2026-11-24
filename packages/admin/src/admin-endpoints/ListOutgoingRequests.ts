import { type HttpContext, INJECT, AdminEndpoint } from "@tymber/core";
import { type JSONSchemaType } from "ajv";
import {
  type FindQuery,
  OutgoingRequestRepository,
} from "../repositories/OutgoingRequestRepository.js";

interface Query {
  size: number;
  sort: "created_at:asc" | "created_at:desc";

  from?: string;
  to?: string;
  requestId?: string;
  methods?: string[];
  origin?: string;
  statusList?: number[];
  minDurationInMs?: number;
}

export class ListOutgoingRequests extends AdminEndpoint {
  static [INJECT] = [OutgoingRequestRepository];

  constructor(private readonly requestRepository: OutgoingRequestRepository) {
    super();
  }

  querySchema: JSONSchemaType<Query> = {
    type: "object",
    properties: {
      size: { type: "integer", minimum: 1, maximum: 1000, default: 100 },
      sort: {
        type: "string",
        enum: ["created_at:asc", "created_at:desc"],
        default: "created_at:desc",
      },
      from: { type: "string", format: "date-time", nullable: true },
      to: { type: "string", format: "date-time", nullable: true },
      requestId: { type: "string", nullable: true },
      methods: { type: "array", items: { type: "string" }, nullable: true },
      origin: { type: "string", nullable: true },
      statusList: { type: "array", items: { type: "integer" }, nullable: true },
      minDurationInMs: { type: "integer", nullable: true },
    },
    required: [],
  };

  override async handle(ctx: HttpContext<never, never, FindQuery>) {
    const { query } = ctx;

    const output = await this.requestRepository.find(ctx, {
      ...query,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });

    return Response.json(output);
  }
}
