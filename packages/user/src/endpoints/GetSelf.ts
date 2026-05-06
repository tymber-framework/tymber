import {
  UserEndpoint,
  type HttpContext,
  type ConnectedUser,
} from "@tymber/core";

export class GetSelf extends UserEndpoint {
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
