import { Endpoint, type HttpContext, INJECT } from "@tymber/core";
import { TodoRepository } from "../repositories/TodoRepository.js";
import { type JSONSchemaType } from "ajv";

interface PathParams {
  todoId: number;
}

export class ReadTodo extends Endpoint {
  static [INJECT] = [TodoRepository];

  constructor(private readonly todoRepository: TodoRepository) {
    super();
  }

  pathParamsSchema: JSONSchemaType<PathParams> = {
    type: "object",
    properties: {
      todoId: { type: "number" },
    },
    required: ["todoId"],
  };

  async handle(ctx: HttpContext<never, PathParams>): Promise<Response> {
    const { todoId } = ctx.pathParams;
    const todo = await this.todoRepository.findById(ctx, todoId);

    if (todo) {
      return Response.json(todo);
    } else {
      return Response.json({ message: "entity not found" }, { status: 404 });
    }
  }
}
