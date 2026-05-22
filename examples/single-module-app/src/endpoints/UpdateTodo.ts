import {
  Endpoint,
  EntityNotFoundError,
  type HttpContext,
  INJECT,
} from "@tymber/core";
import { TodoRepository } from "../repositories/TodoRepository.js";
import { type JSONSchemaType } from "ajv";

interface PathParams {
  todoId: number;
}

interface Payload {
  title: string;
  completed: boolean;
}

export class UpdateTodo extends Endpoint {
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

  payloadSchema: JSONSchemaType<Payload> = {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1, maxLength: 100 },
      completed: { type: "boolean" },
    },
    required: ["title"],
    additionalProperties: false,
  };

  async handle(ctx: HttpContext<Payload, PathParams>): Promise<Response> {
    const { todoId } = ctx.pathParams;

    try {
      await this.todoRepository.update(ctx, {
        id: todoId,
        ...ctx.payload,
      });

      return new Response(null, {
        status: 204,
      });
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        return Response.json({ message: "entity not found" }, { status: 404 });
      }
      throw e;
    }
  }
}
