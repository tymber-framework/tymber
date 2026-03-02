import { describe, it } from "node:test";
import * as assert from "node:assert";
import { buildSpecification } from "../../src";
import { ModuleDefinitions } from "@tymber/core";

describe("buildSpecification", () => {
  it("should extract the query parameters", async () => {
    const moduleDefinitions = new ModuleDefinitions([
      {
        name: "TodoModule",
        version: "1.2.3",
        endpoints: [
          {
            method: "GET",
            path: "/todos",
            handlerName: "listTodos",
            handler: {
              querySchema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["todo", "doing", "done"],
                  },
                },
              },
            } as any,
          },
        ],
        views: [],
        adminEndpoints: [],
        adminViews: [],
        middlewares: [],
      },
    ]);

    const spec = buildSpecification(moduleDefinitions);

    assert.deepStrictEqual(spec.paths, {
      "/todos": {
        get: {
          operationId: "listTodos",
          parameters: [
            {
              in: "query",
              name: "status",
              required: false,
              schema: {
                type: "string",
                enum: ["todo", "doing", "done"],
              },
            },
          ],
          responses: {
            "200": { description: "OK" },
            "400": {
              $ref: "#/components/responses/BadRequest",
            },
            "401": {
              $ref: "#/components/responses/Unauthorized",
            },
            "500": {
              $ref: "#/components/responses/InternalServerError",
            },
          },
          tags: ["TodoModule"],
        },
      },
    });
  });

  it("should extract the path parameters", async () => {
    const moduleDefinitions = new ModuleDefinitions([
      {
        name: "TodoModule",
        version: "1.2.3",
        endpoints: [
          {
            method: "GET",
            path: "/todos/:todoId",
            handlerName: "readTodo",
            handler: {
              pathParamsSchema: {
                type: "object",
                properties: {
                  todoId: {
                    type: "number",
                  },
                },
                required: ["todoId"],
              },
            } as any,
          },
        ],
        views: [],
        adminEndpoints: [],
        adminViews: [],
        middlewares: [],
      },
    ]);

    const spec = buildSpecification(moduleDefinitions);

    assert.deepStrictEqual(spec.paths, {
      "/todos/{todoId}": {
        get: {
          operationId: "readTodo",
          parameters: [
            {
              in: "path",
              name: "todoId",
              required: true,
              schema: {
                type: "number",
              },
            },
          ],
          responses: {
            "200": { description: "OK" },
            "400": {
              $ref: "#/components/responses/BadRequest",
            },
            "401": {
              $ref: "#/components/responses/Unauthorized",
            },
            "500": {
              $ref: "#/components/responses/InternalServerError",
            },
          },
          tags: ["TodoModule"],
        },
      },
    });
  });

  it("should extract the request body", async () => {
    const moduleDefinitions = new ModuleDefinitions([
      {
        name: "TodoModule",
        version: "1.2.3",
        endpoints: [
          {
            method: "POST",
            path: "/todos",
            handlerName: "createTodo",
            handler: {
              payloadSchema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                },
                required: ["title", "description"],
              },
            } as any,
          },
        ],
        views: [],
        adminEndpoints: [],
        adminViews: [],
        middlewares: [],
      },
    ]);

    const spec = buildSpecification(moduleDefinitions);

    assert.deepStrictEqual(spec.paths, {
      "/todos": {
        post: {
          operationId: "createTodo",
          parameters: [],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                    },
                    description: {
                      type: "string",
                    },
                  },
                  required: ["title", "description"],
                },
              },
            },
          },
          responses: {
            "200": { description: "OK" },
            "400": {
              $ref: "#/components/responses/BadRequest",
            },
            "401": {
              $ref: "#/components/responses/Unauthorized",
            },
            "500": {
              $ref: "#/components/responses/InternalServerError",
            },
          },
          tags: ["TodoModule"],
        },
      },
    });
  });

  it("should use the 'openapi' property", async () => {
    const moduleDefinitions = new ModuleDefinitions([
      {
        name: "TodoModule",
        version: "1.2.3",
        endpoints: [
          {
            method: "GET",
            path: "/todos",
            handlerName: "listTodos",
            handler: {
              allowAnonymous: true,
              hasPermission: () => {
                return false;
              },
              openapi: {
                summary: "List todos",
                deprecated: true,
                tags: ["SomeCustomTag"],
              },
            } as any,
          },
        ],
        views: [],
        adminEndpoints: [],
        adminViews: [],
        middlewares: [],
      },
    ]);

    const spec = buildSpecification(moduleDefinitions);

    assert.deepStrictEqual(spec.paths, {
      "/todos": {
        get: {
          operationId: "listTodos",
          summary: "List todos",
          deprecated: true,
          parameters: [],
          responses: {
            "200": { description: "OK" },
            "400": {
              $ref: "#/components/responses/BadRequest",
            },
            "403": {
              $ref: "#/components/responses/Forbidden",
            },
            "500": {
              $ref: "#/components/responses/InternalServerError",
            },
          },
          tags: ["SomeCustomTag"],
        },
      },
    });
  });
});
