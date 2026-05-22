import {
  Endpoint,
  type HttpContext,
  INJECT,
  EntityNotFoundError,
} from "@tymber/core";
import { TodoRepository } from "../repositories/TodoRepository.js";
import { type JSONSchemaType } from "ajv";

interface PathParams {
  todoId: number;
}

export class DeleteTodo extends Endpoint {
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
    try {
      await this.todoRepository.deleteById(ctx, todoId);
      return new Response(null, { status: 204 });
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        return Response.json({ message: "entity not found" }, { status: 404 });
      }
      throw e;
    }
  }
}
