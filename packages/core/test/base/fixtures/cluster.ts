import cluster, { Worker } from "node:cluster";
import * as assert from "node:assert";
import {
  emptyContext,
  initPrimary,
  NodeClusterPubSubService,
} from "../../../src";

function fork() {
  const worker = cluster.fork();

  return new Promise<Worker>((resolve) => {
    worker.on("message", ({ type }) => {
      if (type === "ready") {
        resolve(worker);
      }
    });
  });
}

if (cluster.isPrimary) {
  initPrimary();

  const workers = await Promise.all([fork(), fork()]);

  workers[0].send({ type: "test:start" });
  workers[1].on("message", ({ type, payload }) => {
    if (type === "test:end") {
      assert.equal(payload, "world");
      process.exit(0);
    }
  });
} else {
  const pubSubService = new NodeClusterPubSubService();
  let isSender = false;

  pubSubService.subscribe("hello", (message) => {
    if (isSender) {
      process.exit(1);
    }
    process.send({ type: "test:end", payload: message });
  });

  process.send({ type: "ready" });

  process.on("message", ({ type }) => {
    if (type === "test:start") {
      isSender = true;
      pubSubService.publish(emptyContext(), "hello", "world");
    }
  });
}
