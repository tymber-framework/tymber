import { DB } from "../DB.js";
import { createServer, Server } from "node:http";
import { type AddressInfo } from "node:net";
import { type Module } from "../Module.js";
import { App } from "../App.js";
import { toNodeHandler } from "./toNodeHandler.js";

const CLOSE_DELAY_MS = 200;

export interface BaseTestContext {
  baseUrl: string;
  db: DB;
  close: () => Promise<void>;
}

interface SharedTestContext {
  httpServer: Server;
  baseUrl: string;
  db: DB;
}

let sharedTestContext: SharedTestContext | undefined;
let closeTimer: NodeJS.Timeout | undefined;

export async function createTestApp(
  initDB: () => DB | Promise<DB>,
  modules: Module[],
): Promise<BaseTestContext> {
  if (!sharedTestContext) {
    const httpServer = createServer();

    const [port, db] = await Promise.all([
      startHttpServer(httpServer),
      initDB(),
    ]);
    const baseUrl = `http://localhost:${port}`;

    sharedTestContext = {
      httpServer,
      baseUrl,
      db,
    };
  }

  const { httpServer, baseUrl, db } = sharedTestContext;
  const app = await App.create(db, modules);

  httpServer.removeAllListeners("request");
  httpServer.on("request", toNodeHandler(app.fetch.bind(app)));

  return {
    baseUrl,
    db,
    async close() {
      clearTimeout(closeTimer);

      closeTimer = setTimeout(async () => {
        if (sharedTestContext) {
          const { httpServer } = sharedTestContext;
          sharedTestContext = undefined;

          await Promise.all([closeHttpServer(httpServer), app.close()]);
        }
      }, CLOSE_DELAY_MS);
    },
  };
}

function startHttpServer(httpServer: Server) {
  return new Promise<number>((resolve) => {
    httpServer.listen(0, () => {
      resolve((httpServer.address() as AddressInfo).port);
    });
  });
}

function closeHttpServer(httpServer: Server) {
  return new Promise<void>((resolve) => {
    httpServer.close(() => resolve());
  });
}
