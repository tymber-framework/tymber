import type { Module } from "@tymber/core";
import { SSEService } from "./services/SSEService.js";
import { SSEEndpoint } from "./endpoints/SSEEndpoint.js";

export const SSEModule: Module = {
  name: "@tymber/sse",
  version: "0.0.2",

  init(app) {
    app.component(SSEService);

    app.userEndpoint("GET", "/api/events", SSEEndpoint);
  },
};

export { SSEService };
