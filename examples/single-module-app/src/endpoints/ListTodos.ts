import { Endpoint, type HttpContext, INJECT } from "@tymber/core";
import { TodoRepository, type Query } from "../repositories/TodoRepository.js";
import { type JSONSchemaType } from "ajv";

export class ListTodos extends Endpoint {
  static [INJECT] = [TodoRepository];

  constructor(private readonly todoRepository: TodoRepository) {
    super();
  }

  querySchema: JSONSchemaType<Query> = {
    type: "object",
    properties: {
      completed: { type: "boolean", nullable: true },
      sort: {
        type: "string",
        enum: ["created_at:asc", "created_at:desc"],
        default: "created_at:desc",
      },
    },
    required: [],
  };

  async handle(ctx: HttpContext<never, never, Query>) {
    const todos = await this.todoRepository.findAll(ctx, ctx.query);
    return Response.json(todos);
  }
}
