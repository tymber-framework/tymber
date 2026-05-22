import { Endpoint, type HttpContext, INJECT } from "@tymber/core";
import { TodoRepository } from "../repositories/TodoRepository.js";
import { type JSONSchemaType } from "ajv";

interface Payload {
  title: string;
}

export class CreateTodo extends Endpoint {
  static [INJECT] = [TodoRepository];

  constructor(private readonly todoRepository: TodoRepository) {
    super();
  }

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1, maxLength: 100 },
    },
    required: ["title"],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload>) {
    const { title } = ctx.payload;
    const todo = await this.todoRepository.insert(ctx, {
      title,
      createdAt: new Date(),
      completed: false,
    });
    return Response.json(todo, { status: 201 });
  }
}
