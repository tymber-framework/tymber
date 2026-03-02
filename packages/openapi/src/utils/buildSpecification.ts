import { type ModuleDefinitions, type Route } from "@tymber/core";
import { type OpenAPIV3 } from "../contrib/openapi-types.js";

export function buildSpecification(moduleDefinitions: ModuleDefinitions) {
  // reference: https://swagger.io/specification/
  const spec: OpenAPIV3.Document = {
    openapi: "3.1.0",
    info: {
      title: "",
      version: "",
    },
    paths: {},
    components: {
      schemas: {
        Error: {
          type: "object",
          required: ["message"],
          properties: {
            message: {
              type: "string",
            },
          },
        },
        ValidationError: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationError" },
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        Forbidden: {
          description: "Forbidden",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        NotFound: {
          description: "Not Found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        InternalServerError: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  };

  for (const module of moduleDefinitions.modules) {
    for (const endpoint of module.endpoints) {
      const method = endpoint.method.toLowerCase() as OpenAPIV3.HttpMethods;
      const path = endpoint.path.replace(/:(\w+)/g, "{$1}");

      spec.paths[path] = spec.paths[path] || {};
      spec.paths[path][method] = createOperation(module.name, endpoint);
    }
  }

  return spec;
}

function createOperation(moduleName: string, endpoint: Route) {
  const operation: OpenAPIV3.OperationObject = {
    operationId: endpoint.handlerName,
    tags: [moduleName],
    parameters: [],
    responses: {
      200: {
        description: "OK",
      },
      400: { $ref: "#/components/responses/BadRequest" },
      500: { $ref: "#/components/responses/InternalServerError" },
    },
  };

  // @ts-expect-error protected properties
  const { pathParamsSchema, querySchema, payloadSchema } = endpoint.handler;

  if (pathParamsSchema && pathParamsSchema.properties) {
    for (const [name, schema] of Object.entries(pathParamsSchema.properties)) {
      operation.parameters!.push({
        name,
        in: "path",
        required: !!pathParamsSchema.required?.includes(name),
        schema: schema as OpenAPIV3.SchemaObject,
      });
    }
  }

  if (querySchema && querySchema.properties) {
    for (const [name, schema] of Object.entries(querySchema.properties)) {
      operation.parameters!.push({
        name,
        in: "query",
        required: !!querySchema.required?.includes(name),
        schema: schema as OpenAPIV3.SchemaObject,
      });
    }
  }

  if (payloadSchema) {
    operation.requestBody = {
      content: {
        "application/json": {
          schema: payloadSchema,
        },
      },
    };
  }

  // @ts-expect-error protected properties
  const { allowAnonymous, hasPermission } = endpoint.handler;

  if (!allowAnonymous) {
    operation.responses["401"] = {
      $ref: "#/components/responses/Unauthorized",
    };
  }

  if (typeof hasPermission === "function") {
    operation.responses["403"] = {
      $ref: "#/components/responses/Forbidden",
    };
  }

  // @ts-expect-error custom OpenAPI properties
  Object.assign(operation, endpoint.handler["openapi"]);

  return operation;
}
