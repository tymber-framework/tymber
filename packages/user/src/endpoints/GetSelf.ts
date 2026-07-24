import {
  UserEndpoint,
  type HttpContext,
  type ConnectedUser,
  INJECT,
  I18nService,
} from "@tymber/core";

export class GetSelf extends UserEndpoint {
  static [INJECT] = [I18nService];

  public openapi = {
    summary: "Get the current user",
    responses: {
      200: {
        description: "The current user",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["id", "role", "groups"],
              properties: {
                id: { type: "string", format: "uuid" },
                firstName: { type: "string" },
                lastName: { type: "string" },
                email: { type: "string", format: "email" },
                role: {
                  type: "object",
                  required: ["id", "label"],
                  properties: {
                    id: { type: "integer" },
                    label: { type: "string" },
                  },
                },
                groups: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["id", "role", "label"],
                    properties: {
                      id: { type: "string", format: "uuid" },
                      label: { type: "string" },
                      role: {
                        type: "object",
                        required: ["id", "label"],
                        properties: {
                          id: { type: "integer" },
                          label: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
    },
  };

  constructor(private readonly i18n: I18nService) {
    super();
  }

  handle(ctx: HttpContext) {
    const u = ctx.user as ConnectedUser;

    return Response.json({
      id: u.externalId,

      firstName: u.firstName,
      lastName: u.lastName,
      role: {
        id: u.role,
        label: this.i18n.translate(
          ctx,
          ctx.locale,
          `tymber.user.userRoles.${u.role}`,
        ),
      },
      email: u.email,

      groups: u.groups.map((group) => ({
        id: group.externalId,
        role: {
          id: group.role,
          label: this.i18n.translate(
            ctx,
            ctx.locale,
            `tymber.user.groupRoles.${group.role}`,
          ),
        },
        label: group.label,
      })),
    });
  }
}
