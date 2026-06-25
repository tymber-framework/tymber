# Scaling Out

As your application grows, you may need to scale it to handle more traffic. Tymber provides built-in support for both vertical scaling (using all cores on a single machine) and horizontal scaling (across multiple machines).

## Vertical Scaling

### With Node.js cluster

By default, Node.js application code runs on a single event loop. To take advantage of multicore systems, you can use the built-in `node:cluster` module to run multiple instances of your application:

```ts
import cluster from "node:cluster";
import { availableParallelism } from "node:os";
import { createServer } from "node:http";
import {
  App,
  initPrimary,
  NodeClusterPubSubService,
  toNodeHandler,
} from "@tymber/core";

async function startWorker() {
  // PubSubService implementation that will use the IPC channel to communicate with the other instances
  // highlight-next-line
  const pubSubService = new NodeClusterPubSubService();

  const app = await App.create({
    components: [pubSubService],
    modules: [
      // ...
    ],
  });

  const httpServer = createServer(toNodeHandler(app.fetch));

  httpServer.listen(8080, () => {
    console.log(
      `Worker ${process.pid} started and listening on http://localhost:8080`,
    );
  });
  
  async function onShutdown() {
    console.log(`Worker ${process.pid} shutting down`);
    await app.close();
    process.exit(0);
  }
  
  process.on("SIGTERM", onShutdown);
  process.on("SIGINT", onShutdown);
}

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // initialize the IPC channel for the primary process
  // highlight-next-line
  initPrimary();

  for (let i = 0; i < availableParallelism(); i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`,
    );
    console.log("Starting a new worker");
    cluster.fork();
  });
} else {
  startWorker().catch((err) => {
    console.error(`Failed to start worker ${process.pid}:`, err);
    process.exit(1);
  });
}
```

## Horizontal Scaling

### With PostgreSQL

When scaling across multiple machines, worker processes on different nodes need a way to communicate. Tymber leverages PostgreSQL's `LISTEN/NOTIFY` mechanism through the `PostgresPubSubService` to provide a distributed PubSub system without requiring an external message broker like Redis.

```ts
import * as pg from "pg";
import { PostgresDB, PostgresPubSubService } from "@tymber/postgres";
import { App } from "@tymber/core";

const pgPool = new pg.Pool(/* ... */);

const db = new PostgresDB(pgPool);
// highlight-next-line
const pubSubService = new PostgresPubSubService(pgPool);

const app = await App.create({
  components: [db, pubSubService],
  modules: [
    // ...
  ],
});

// [...]
```

## Combining vertical and horizontal scaling

In this setup, each worker communicates with the local primary process through Node.js IPC, while the primary process bridges messages between machines through PostgreSQL `LISTEN/NOTIFY`.

```ts
import cluster from "node:cluster";
import { availableParallelism } from "node:os";
import { createServer } from "node:http";
import {
  App,
  NodeClusterPubSubService,
  toNodeHandler,
} from "@tymber/core";
import * as pg from "pg";
import { initPrimary } from "@tymber/postgres";

async function startPrimary() {
  console.log(`Primary ${process.pid} is running`);

  const pgPool = new pg.Pool(/* ... */);

  // initialize the IPC channel for the primary process and use LISTEN/NOTIFY to communicate with instances on other machines
  // highlight-next-line
  await initPrimary(pgPool);

  for (let i = 0; i < availableParallelism(); i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`,
    );
    console.log("Starting a new worker");
    cluster.fork();
  });
}

async function startWorker() {
  // PubSubService implementation that will use the IPC channel to communicate with the other instances
  // highlight-next-line
  const pubSubService = new NodeClusterPubSubService();

  const app = await App.create({
    components: [pubSubService],
    modules: [
      // ...
    ],
  });

  const httpServer = createServer(toNodeHandler(app.fetch));

  httpServer.listen(8080, () => {
    console.log(
      `Worker ${process.pid} started and listening on http://localhost:8080`,
    );
  });

  async function onShutdown() {
    console.log(`Worker ${process.pid} shutting down`);
    await app.close();
    process.exit(0);
  }

  process.on("SIGTERM", onShutdown);
  process.on("SIGINT", onShutdown);
}

if (cluster.isPrimary) {
  startPrimary().catch((err) => {
    console.error(`Failed to start primary process:`, err);
    process.exit(1);
  });
} else {
  startWorker().catch((err) => {
    console.error(`Failed to start worker ${process.pid}:`, err);
    process.exit(1);
  });
}
```
