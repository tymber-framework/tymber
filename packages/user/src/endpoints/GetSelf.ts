import {
  UserEndpoint,
  type HttpContext,
  type ConnectedUser,
  INJECT,
  I18nService,
} from "@tymber/core";

export class GetSelf extends UserEndpoint {
  static [INJECT] = [I18nService];

  constructor(private readonly i18n: I18nService) {
    super();
  }

  handle(ctx: HttpContext) {
    const u = ctx.user as ConnectedUser;

    return Response.json({
      id: u.id,

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
        id: group.id,
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
