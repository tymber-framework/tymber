import { Component } from "./Component.js";
import { createDebug } from "./utils/createDebug.js";
import type { Context } from "./Context.js";
import { EventEmitter } from "./EventEmitter.js";
import cluster from "node:cluster";
import { randomId } from "./utils/randomId.js";

const debug = createDebug("PubSubService");

interface Message {
  from: string;
  type: string;
  payload?: any;
}

export class PubSubService extends Component {
  protected readonly id = randomId();
  private eventEmitter = new EventEmitter();

  public publish(_ctx: Context, _type: string, _payload?: any) {
    // noop
  }

  public subscribe<T>(type: string, handler: (payload: T) => void): void {
    this.eventEmitter.on(type, handler);
  }

  protected onMessage(message: Message) {
    if (message.from === this.id) {
      debug("ignore message from self");
      return;
    }
    debug("received message %s", message.type);
    this.eventEmitter.emit(message.type, message.payload);
  }
}

function ignoreError() {}

export class NodeClusterPubSubService extends PubSubService {
  constructor() {
    super();
    if (!cluster.isWorker) {
      throw "not worker";
    }
    process.on("message", (message: Message) => this.onMessage(message));
  }

  override publish(_ctx: Context, type: string, payload?: any) {
    if (typeof process.send !== "function") {
      return;
    }
    debug("sending message %s", type);
    const message = {
      from: this.id,
      type,
      payload,
    } as Message;
    process.send(message, undefined, {}, ignoreError);
  }
}

export function initPrimary() {
  if (!cluster.isPrimary) {
    throw "not primary";
  }

  cluster.on("message", (worker, message) => {
    const emitterId = String(worker.id);
    debug("forwarding message %s to other workers", message.type);
    for (const workerId in cluster.workers) {
      if (workerId !== emitterId) {
        cluster.workers[workerId]?.send(message, ignoreError);
      }
    }
  });
}
