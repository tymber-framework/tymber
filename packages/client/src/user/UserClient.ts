import { Client } from "../Client.js";

export class UserClient extends Client {
  public getSelf() {
    return this.fetch({
      method: "GET",
      path: "/api/self",
    });
  }

  public logOut() {
    return this.fetch({
      method: "POST",
      path: "/api/logout",
    });
  }
}
