import { Client } from "../Client.js";

interface AdminUser {
  id: number;
  createdBy: number;
  createdAt: string;
  updatedBy: number;
  updatedAt: string;
  username: string;
}

interface Migration {
  module: string;
  id: number;
  name: string;
  runAt: string;
}

interface AdminQuery {
  id: number;
  createdBy: number;
  createdAt: string;
  updatedBy: number;
  updatedAt: string;
  query: string;
  comment: string;
}

export class AdminClient extends Client {
  public getSelf() {
    return this.fetch<{ id: number }>({
      path: "/api/admin/self",
    });
  }

  public init(payload: {
    applicationName: string;
    environmentName: string;
    environmentColorHex: string;
    username: string;
    password: string;
  }) {
    return this.fetch<void>({
      method: "POST",
      path: "/api/admin/init",
      payload,
    });
  }

  public initPassword(payload: { password: string }) {
    return this.fetch({
      method: "POST",
      path: "/api/admin/init_password",
      payload,
    });
  }

  public logIn(payload: { username: string; password: string }) {
    // TODO properly type the body in case of error
    return this.fetch({
      method: "POST",
      path: "/api/admin/login",
      payload,
    });
  }

  public logOut() {
    return this.fetch<void>({
      method: "POST",
      path: "/api/admin/logout",
    });
  }

  public createAdminUser(payload: { username: string; password: string }) {
    return this.fetch<void>({
      method: "POST",
      path: "/api/admin/admin_users",
      payload,
    });
  }

  public listAdminUsers(query?: {
    size?: number;
    sort?: "username:asc" | "username:desc";
    q?: string;
  }) {
    return this.fetch<{ items: AdminUser[] }>({
      path: "/api/admin/admin_users",
      query,
    });
  }

  public listMigrations(query?: {
    size?: number;
    sort?: "run_at:asc" | "run_at:desc";
  }) {
    return this.fetch<{ items: Migration[] }>({
      path: "/api/admin/migrations",
      query,
    });
  }

  public listAdminQueries(query?: {
    q?: string;
    size?: number;
    sort?: "created_at:asc" | "created_at:desc";
  }) {
    return this.fetch<{ items: AdminQuery[] }>({
      path: "/api/admin/admin_queries",
      query,
    });
  }

  public dryRunAdminQuery(payload: { query: string }) {
    return this.fetch<{ result: string }>({
      method: "POST",
      path: "/api/admin/admin_queries/_dry_run",
      payload,
    });
  }

  public runAdminQuery(payload: { query: string; comment: string }) {
    return this.fetch<{ result: string }>({
      method: "POST",
      path: "/api/admin/admin_queries",
      payload,
    });
  }
}
