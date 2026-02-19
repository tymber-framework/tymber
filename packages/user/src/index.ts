import { join } from "node:path";
import type { Module } from "@tymber/core";
import { UserRepository } from "./repositories/UserRepository.js";
import { GroupRepository } from "./repositories/GroupRepository.js";
import { ParseSession } from "./middlewares/ParseSession.js";
import { ImpersonateUser } from "./admin-endpoints/ImpersonateUser.js";
import { ListUsers } from "./admin-endpoints/ListUsers.js";
import { GetSelf } from "./endpoints/GetSelf.js";
import { ListUsersView } from "./admin-views/ListUsersView.js";
import { UserDetailsView } from "./admin-views/UserDetailsView.js";
import { ListGroupsView } from "./admin-views/ListGroupsView.js";
import { GroupDetailsView } from "./admin-views/GroupDetailsView.js";
import { ListGroups } from "./admin-endpoints/ListGroups.js";
import { LogOut } from "./endpoints/LogOut.js";
import { AddUserToGroup } from "./admin-endpoints/AddUserToGroup.js";
import { RemoveUserFromGroup } from "./admin-endpoints/RemoveUserFromGroup.js";
import { ListUsersInGroup } from "./admin-endpoints/ListUsersInGroup.js";
import { ListGroupsForUser } from "./admin-endpoints/ListGroupsForUser.js";

export const UserModule: Module = {
  name: "@tymber/user",
  version: "0.1.0",

  assetsDir: join(import.meta.dirname, "..", "assets"),

  adminSidebarItems: [
    {
      path: "/admin/users",
      label: "tymber.user.users",
      // source: https://pictogrammers.com/library/mdi/icon/account-circle-outline/
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>account-circle-outline</title><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7.07,18.28C7.5,17.38 10.12,16.5 12,16.5C13.88,16.5 16.5,17.38 16.93,18.28C15.57,19.36 13.86,20 12,20C10.14,20 8.43,19.36 7.07,18.28M18.36,16.83C16.93,15.09 13.46,14.5 12,14.5C10.54,14.5 7.07,15.09 5.64,16.83C4.62,15.5 4,13.82 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,13.82 19.38,15.5 18.36,16.83M12,6C10.06,6 8.5,7.56 8.5,9.5C8.5,11.44 10.06,13 12,13C13.94,13 15.5,11.44 15.5,9.5C15.5,7.56 13.94,6 12,6M12,11A1.5,1.5 0 0,1 10.5,9.5A1.5,1.5 0 0,1 12,8A1.5,1.5 0 0,1 13.5,9.5A1.5,1.5 0 0,1 12,11Z" fill="currentColor" /></svg>',
    },
    {
      path: "/admin/groups",
      label: "tymber.user.groups",
      // source: https://pictogrammers.com/library/mdi/icon/account-group-outline/
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>account-group-outline</title><path d="M12,5A3.5,3.5 0 0,0 8.5,8.5A3.5,3.5 0 0,0 12,12A3.5,3.5 0 0,0 15.5,8.5A3.5,3.5 0 0,0 12,5M12,7A1.5,1.5 0 0,1 13.5,8.5A1.5,1.5 0 0,1 12,10A1.5,1.5 0 0,1 10.5,8.5A1.5,1.5 0 0,1 12,7M5.5,8A2.5,2.5 0 0,0 3,10.5C3,11.44 3.53,12.25 4.29,12.68C4.65,12.88 5.06,13 5.5,13C5.94,13 6.35,12.88 6.71,12.68C7.08,12.47 7.39,12.17 7.62,11.81C6.89,10.86 6.5,9.7 6.5,8.5C6.5,8.41 6.5,8.31 6.5,8.22C6.2,8.08 5.86,8 5.5,8M18.5,8C18.14,8 17.8,8.08 17.5,8.22C17.5,8.31 17.5,8.41 17.5,8.5C17.5,9.7 17.11,10.86 16.38,11.81C16.5,12 16.63,12.15 16.78,12.3C16.94,12.45 17.1,12.58 17.29,12.68C17.65,12.88 18.06,13 18.5,13C18.94,13 19.35,12.88 19.71,12.68C20.47,12.25 21,11.44 21,10.5A2.5,2.5 0 0,0 18.5,8M12,14C9.66,14 5,15.17 5,17.5V19H19V17.5C19,15.17 14.34,14 12,14M4.71,14.55C2.78,14.78 0,15.76 0,17.5V19H3V17.07C3,16.06 3.69,15.22 4.71,14.55M19.29,14.55C20.31,15.22 21,16.06 21,17.07V19H24V17.5C24,15.76 21.22,14.78 19.29,14.55M12,16C13.53,16 15.24,16.5 16.23,17H7.77C8.76,16.5 10.47,16 12,16Z" fill="currentColor" /></svg>',
    },
  ],

  init(app) {
    app.component(UserRepository);
    app.component(GroupRepository);

    app.middleware(ParseSession);

    app.endpoint("GET", "/api/self", GetSelf);
    app.endpoint("POST", "/api/logout", LogOut);

    app.adminView("/admin/users", ListUsersView);
    app.adminView("/admin/users/:userId", UserDetailsView);
    app.adminView("/admin/groups", ListGroupsView);
    app.adminView("/admin/groups/:groupId", GroupDetailsView);

    app.adminEndpoint("GET", "/api/admin/users", ListUsers);
    app.adminEndpoint(
      "GET",
      "/api/admin/users/:userId/groups",
      ListGroupsForUser,
    );
    app.adminEndpoint("GET", "/api/admin/groups", ListGroups);
    app.adminEndpoint(
      "GET",
      "/api/admin/groups/:groupId/users",
      ListUsersInGroup,
    );
    app.adminEndpoint(
      "POST",
      "/api/admin/users/:userId/_impersonate",
      ImpersonateUser,
    );
    app.adminEndpoint(
      "POST",
      "/api/admin/users/:userId/groups/:groupId",
      AddUserToGroup,
    );
    app.adminEndpoint(
      "DELETE",
      "/api/admin/users/:userId/groups/:groupId",
      RemoveUserFromGroup,
    );
  },
};

export { USER_ROLES } from "./repositories/UserRepository.js";
