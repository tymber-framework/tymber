import { type Module } from "@tymber/core";
import { HelloWorld } from "./endpoints/HelloWorld.js";

export const MainModule: Module = {
  name: "main",
  version: "0.1.0",

  async init(app) {
    app.endpoint("GET", "/hello", HelloWorld);
  },
};
