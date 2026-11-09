import { join } from "node:path";
import type { Module, AppInit } from "@tymber/core";
import { LogRepository } from "./repositories/LogRepository.js";
import { DBLogService } from "./services/DBLogService.js";
import { ListLogs } from "./admin-endpoints/ListLogs.js";
import { ListLogComponents } from "./admin-endpoints/ListLogComponents.js";
import { ListLogsView } from "./admin-views/ListLogsView.js";

export const LogModule: Module = {
  name: "@tymber/log",
  version: "0.0.0",

  assetsDir: join(import.meta.dirname, "..", "assets"),

  adminSidebarItems: [
    {
      path: "/admin/logs",
      label: "tymber.log.logs",
      // source: https://pictogrammers.com/library/mdi/icon/file-document-outline/
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>file-document-outline</title><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" fill="currentColor" /></svg>',
    },
  ],

  init(app: AppInit) {
    app.component(LogRepository);
    app.component(DBLogService);

    app.adminEndpoint("GET", "/api/admin/logs", ListLogs);
    app.adminEndpoint("GET", "/api/admin/logs/components", ListLogComponents);

    app.adminView("/admin/logs", ListLogsView);
  },
};
