import { Client } from "../Client.js";

type LogLevel = "debug" | "info" | "warn" | "error";

interface Log {
  id: string;
  level: LogLevel;
  component?: string;
  message: string;
  createdAt: string;
}

export class LogAdminClient extends Client {
  listLogs(query?: {
    levels?: LogLevel[];
    components?: string[];
    from?: string;
    to?: string;
    page?: number;
    size?: number;
    sort?: "created_at:asc" | "created_at:desc";
  }) {
    return this.fetch<{ items: Log[] }>({
      method: "GET",
      path: "/api/admin/logs",
      query,
    });
  }

  listLogComponents() {
    return this.fetch<{ items: string[] }>({
      method: "GET",
      path: "/api/admin/logs/components",
    });
  }
}
