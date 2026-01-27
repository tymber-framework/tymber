import { Endpoint, type HttpContext, type ConnectedUser } from "@tymber/common";

export class GetSelf extends Endpoint {
  handle({ user }: HttpContext) {
    const u = user as ConnectedUser;
    return Response.json({
      id: u.id,

      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,

      groups: u.groups.map((group) => ({
        id: group.id,
        role: group.role,
        label: group.label,
      })),
    });
  }
}
