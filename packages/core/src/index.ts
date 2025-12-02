import { type AppInit, FS, type Module } from "@tymber/common";
import { MiscRepository } from "./repositories/MiscRepository.js";
import { AdminUserRepository } from "./repositories/AdminUserRepository.js";
import { MigrationRepository } from "./repositories/MigrationRepository.js";
import { CSRF } from "./middlewares/CSRF.js";
import { CORS } from "./middlewares/CORS.js";
import { ParseAdminSession } from "./middlewares/ParseAdminSession.js";
import { CreateAdminUser } from "./admin-endpoints/CreateAdminUser.js";
import { Init } from "./admin-endpoints/Init.js";
import { GetSelf } from "./admin-endpoints/GetSelf.js";
import { ListAdminUsers } from "./admin-endpoints/ListAdminUsers.js";
import { ListMigrations } from "./admin-endpoints/ListMigrations.js";
import { AdminCookieService } from "./services/AdminCookieService.js";
import { LogIn } from "./admin-endpoints/LogIn.js";
import { LogOut } from "./admin-endpoints/LogOut.js";
import { CheckInit } from "./middlewares/CheckInit.js";
import { InitView } from "./admin-views/InitView.js";
import { ListMigrationsView } from "./admin-views/ListMigrationsView.js";
import { LogInView } from "./admin-views/LogInView.js";
import { ListRoutesView } from "./admin-views/ListRoutesView.js";
import { ListAdminUsersView } from "./admin-views/ListAdminUsersView.js";
import { ConfigView } from "./admin-views/ConfigView.js";
import { HomeView } from "./admin-views/HomeView.js";
import { ListAdminQueries } from "./admin-endpoints/ListAdminQueries.js";
import { DryRunAdminQuery } from "./admin-endpoints/DryRunAdminQuery.js";
import { RunAdminQuery } from "./admin-endpoints/RunAdminQuery.js";
import { AdminQueryRepository } from "./repositories/AdminQueryRepository.js";
import { ListAdminQueriesView } from "./admin-views/ListAdminQueriesView.js";
import { InitPassword } from "./admin-endpoints/InitPassword.js";
import { InitPasswordView } from "./admin-views/InitPasswordView.js";

export const CoreModule: Module = {
  name: "@tymber/core",
  version: "0.0.1",

  assetsDir: FS.join(import.meta.dirname, "..", "assets"),

  adminSidebarItems: [
    {
      label: "tymber.migrations.migrations",
      path: "/admin/migrations",
      // source: https://pictogrammers.com/library/mdi/icon/package-variant-closed/
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>package-variant-closed</title><path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L10.11,5.22L16,8.61L17.96,7.5L12,4.15M6.04,7.5L12,10.85L13.96,9.75L8.08,6.35L6.04,7.5M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V9.21L13,12.58V19.29L19,15.91Z" fill="currentColor" /></svg>',
    },
    {
      label: "tymber.routes.routes",
      path: "/admin/routes",
      // source: https://pictogrammers.com/library/mdi/icon/format-list-bulleted/
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>format-list-bulleted</title><path d="M7,5H21V7H7V5M7,13V11H21V13H7M4,4.5A1.5,1.5 0 0,1 5.5,6A1.5,1.5 0 0,1 4,7.5A1.5,1.5 0 0,1 2.5,6A1.5,1.5 0 0,1 4,4.5M4,10.5A1.5,1.5 0 0,1 5.5,12A1.5,1.5 0 0,1 4,13.5A1.5,1.5 0 0,1 2.5,12A1.5,1.5 0 0,1 4,10.5M7,19V17H21V19H7M4,16.5A1.5,1.5 0 0,1 5.5,18A1.5,1.5 0 0,1 4,19.5A1.5,1.5 0 0,1 2.5,18A1.5,1.5 0 0,1 4,16.5Z" fill="currentColor" /></svg>',
    },
    {
      label: "tymber.adminUsers.adminUsers",
      path: "/admin/admin_users",
      // source: https://pictogrammers.com/library/mdi/icon/shield-account-outline/
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>shield-account-outline</title><path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,3.18L19,6.3V11.22C19,12.92 18.5,14.65 17.65,16.17C16,14.94 13.26,14.5 12,14.5C10.74,14.5 8,14.94 6.35,16.17C5.5,14.65 5,12.92 5,11.22V6.3L12,3.18M12,6A3.5,3.5 0 0,0 8.5,9.5A3.5,3.5 0 0,0 12,13A3.5,3.5 0 0,0 15.5,9.5A3.5,3.5 0 0,0 12,6M12,8A1.5,1.5 0 0,1 13.5,9.5A1.5,1.5 0 0,1 12,11A1.5,1.5 0 0,1 10.5,9.5A1.5,1.5 0 0,1 12,8M12,16.5C13.57,16.5 15.64,17.11 16.53,17.84C15.29,19.38 13.7,20.55 12,21C10.3,20.55 8.71,19.38 7.47,17.84C8.37,17.11 10.43,16.5 12,16.5Z" fill="currentColor" /></svg>',
    },
    {
      label: "tymber.config.config",
      path: "/admin/config",
      // source: https://pictogrammers.com/library/mdi/icon/tune-vertical/
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>tune-vertical</title><path d="M7 3H5V9H7V3M19 3H17V13H19V3M3 13H5V21H7V13H9V11H3V13M15 7H13V3H11V7H9V9H15V7M11 21H13V11H11V21M15 15V17H17V21H19V17H21V15H15Z" fill="currentColor" /></svg>',
    },
    {
      label: "tymber.adminQueries.adminQueries",
      path: "/admin/admin_queries",
      // source: https://pictogrammers.com/library/mdi/icon/database-search-outline/
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>database-search-outline</title><path d="M11 18.95C7.77 18.72 6 17.45 6 17V14.77C7.13 15.32 8.5 15.69 10 15.87C10 15.21 10.04 14.54 10.21 13.89C8.5 13.67 6.97 13.16 6 12.45V9.64C7.43 10.45 9.5 10.97 11.82 11C11.85 10.97 11.87 10.93 11.9 10.9C14.1 8.71 17.5 8.41 20 10.03V7C20 4.79 16.42 3 12 3S4 4.79 4 7V17C4 19.21 7.59 21 12 21C12.34 21 12.68 21 13 20.97C12.62 20.72 12.24 20.44 11.9 20.1C11.55 19.74 11.25 19.36 11 18.95M12 5C15.87 5 18 6.5 18 7S15.87 9 12 9 6 7.5 6 7 8.13 5 12 5M20.31 17.9C20.75 17.21 21 16.38 21 15.5C21 13 19 11 16.5 11S12 13 12 15.5 14 20 16.5 20C17.37 20 18.19 19.75 18.88 19.32L22 22.39L23.39 21L20.31 17.9M16.5 18C15.12 18 14 16.88 14 15.5S15.12 13 16.5 13 19 14.12 19 15.5 17.88 18 16.5 18Z" fill="currentColor" /></svg>',
    },
  ],

  async init(app: AppInit) {
    app.component(MiscRepository);
    app.component(AdminUserRepository);
    app.component(MigrationRepository);
    app.component(AdminQueryRepository);

    app.component(AdminCookieService);

    app.middleware(CSRF);
    app.middleware(CORS);
    app.middleware(CheckInit);
    app.middleware(ParseAdminSession);

    app.adminView("/admin", HomeView);
    app.adminView("/admin/init", InitView);
    app.adminView("/admin/init_password", InitPasswordView);
    app.adminView("/admin/login", LogInView);
    app.adminView("/admin/config", ConfigView);
    app.adminView("/admin/admin_users", ListAdminUsersView);
    app.adminView("/admin/migrations", ListMigrationsView);
    app.adminView("/admin/routes", ListRoutesView);
    app.adminView("/admin/admin_queries", ListAdminQueriesView);

    app.adminEndpoint("POST", "/api/admin/init", Init);
    app.adminEndpoint("POST", "/api/admin/init_password", InitPassword);
    app.adminEndpoint("GET", "/api/admin/self", GetSelf);
    app.adminEndpoint("POST", "/api/admin/login", LogIn);
    app.adminEndpoint("POST", "/api/admin/logout", LogOut);
    app.adminEndpoint("GET", "/api/admin/admin_users", ListAdminUsers);
    app.adminEndpoint("POST", "/api/admin/admin_users", CreateAdminUser);
    app.adminEndpoint("GET", "/api/admin/migrations", ListMigrations);
    app.adminEndpoint("GET", "/api/admin/admin_queries", ListAdminQueries);
    app.adminEndpoint(
      "POST",
      "/api/admin/admin_queries/_dry_run",
      DryRunAdminQuery,
    );
    app.adminEndpoint("POST", "/api/admin/admin_queries", RunAdminQuery);
  },
};

export { initTestDB } from "./utils/initTestDB.js";
