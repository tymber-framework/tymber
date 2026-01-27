import { Client } from "../Client.js";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Group {
  id: string;
  label?: string;
}

export class UserAdminClient extends Client {
  listUsers(query?: {
    page?: number;
    size?: number;
    sort?:
      | "first_name:asc"
      | "first_name:desc"
      | "last_name:asc"
      | "last_name:desc"
      | "email:asc"
      | "email:desc";
    q?: string;
  }) {
    return this.fetch<{ items: User[] }>({
      method: "GET",
      path: "/api/admin/users",
      query,
    });
  }

  listUsersInGroup(
    groupId: string,
    query?: {
      page?: number;
      size?: number;
      sort?:
        | "first_name:asc"
        | "first_name:desc"
        | "last_name:asc"
        | "last_name:desc"
        | "email:asc"
        | "email:desc";
      q?: string;
    },
  ) {
    return this.fetch<{ items: User[] }>({
      method: "GET",
      path: `/api/admin/groups/${groupId}/users`,
      query,
    });
  }

  listGroups(query?: {
    page?: number;
    size?: number;
    sort?: "label:asc" | "label:desc";
    q?: string;
  }) {
    return this.fetch<{ items: Group[] }>({
      method: "GET",
      path: "/api/admin/groups",
      query,
    });
  }

  listGroupsForUser(
    userId: string,
    query?: {
      page?: number;
      size?: number;
      sort?: "label:asc" | "label:desc";
      q?: string;
    },
  ) {
    return this.fetch<{ items: Group[] }>({
      method: "GET",
      path: `/api/admin/users/${userId}/groups`,
      query,
    });
  }

  impersonateUser(userId: string) {
    return this.fetch({
      method: "POST",
      path: `/api/admin/users/${userId}/_impersonate`,
    });
  }

  addUserToGroup(userId: string, groupId: string, role: number) {
    return this.fetch({
      method: "POST",
      path: `/api/admin/users/${userId}/groups/${groupId}`,
      payload: { role },
    });
  }

  removeUserFromGroup(userId: string, groupId: string) {
    return this.fetch({
      method: "DELETE",
      path: `/api/admin/users/${userId}/groups/${groupId}`,
    });
  }
}
