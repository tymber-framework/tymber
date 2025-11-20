import {
  type Context,
  createDebug,
  PubSubService,
  randomId,
} from "@tymber/common";
import * as pg from "pg";
import cluster from "node:cluster";

const debug = createDebug("pubsub");
const CHANNEL_NAME = "tymber";

function ignoreError() {}

function createReconnectingListener(
  pgPool: pg.Pool,
  onNotification: (message: any) => void,
) {
  let releaseClient: () => void;

  function scheduleReconnection() {
    setTimeout(
      () =>
        connect().catch((err) => {
          debug("error while creating client: %s", err);
          scheduleReconnection();
        }),
      2000,
    );
  }

  async function connect() {
    if (pgPool.ending || pgPool.ended) {
      debug("postgres pool is closed");
      return;
    }

    const client = await pgPool.connect();

    debug("postgres client is connected");

    await client.query(`LISTEN "${CHANNEL_NAME}"`);

    client.on("notification", onNotification);

    function onEnd() {
      debug("postgres client is disconnected");
      scheduleReconnection();
    }

    client.on("end", onEnd);

    releaseClient = () => {
      client.removeListener("end", onEnd);
      client.release();
    };
  }

  const endMethod = pgPool.end as () => Promise<void>;

  pgPool.end = () => {
    releaseClient();
    return endMethod.call(pgPool);
  };

  return connect();
}

export class PostgresPubSubService extends PubSubService {
  constructor(private readonly pgPool: pg.Pool) {
    super();
  }

  override init() {
    return createReconnectingListener(
      this.pgPool,
      ({ payload }: { payload: string }) => {
        this.onMessage(JSON.parse(payload));
      },
    );
  }

  override publish(ctx: Context, type: string, payload: any) {
    const message = JSON.stringify({
      from: this.id,
      type,
      payload,
    });

    ((ctx.tx as pg.PoolClient) || this.pgPool)
      .query("SELECT pg_notify($1, $2)", [CHANNEL_NAME, message])
      .catch(() => {});
  }
}

export async function initPrimary(pgPool: pg.Pool) {
  if (!cluster.isPrimary) {
    throw "not primary";
  }

  const nodeId = randomId();

  cluster.on("message", (worker, message) => {
    const emitterId = String(worker.id);
    debug("forwarding message %s to other workers", message.type);
    for (const workerId in cluster.workers) {
      if (workerId !== emitterId) {
        cluster.workers[workerId]?.send(message, ignoreError);
      }
    }

    debug("forwarding message %s to other nodes", message.type);
    pgPool
      .query("SELECT pg_notify($1, $2)", [
        CHANNEL_NAME,
        JSON.stringify({
          ...message,
          nodeId,
        }),
      ])
      .catch(() => {});
  });

  await createReconnectingListener(
    pgPool,
    ({ payload }: { payload: string }) => {
      const message = JSON.parse(payload);

      if (message.nodeId === nodeId) {
        debug("ignore message from self");
        return;
      }

      debug("forwarding message %s to workers", message.type);
      for (const workerId in cluster.workers) {
        cluster.workers[workerId]?.send(message, ignoreError);
      }
    },
  );
}
