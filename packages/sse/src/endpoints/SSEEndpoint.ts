import {
  ConfigService,
  type ConnectedUser,
  type HttpContext,
  INJECT,
  randomUUID,
  UserEndpoint,
} from "@tymber/core";
import { type Filter, SSEService } from "../services/SSEService.js";
import { type ReadableStreamController } from "node:stream/web";

interface Config {
  SSE_PING_INTERVAL_IN_SECONDS: number;
}

interface SSEClient {
  controller: ReadableStreamController<string>;
  lastMessage: number;
  user: ConnectedUser;
}

function isIncluded(filter: Filter, user: ConnectedUser) {
  switch (filter.type) {
    case "all":
      return true;
    case "user":
      return user.id === filter.data.userId;
    case "role":
      return user.roles.includes(filter.data.role);
    case "group":
      return user.groups.some((group) => group.id === filter.data.groupId);
    case "group-role":
      return user.groups.some(
        (group) =>
          group.id === filter.data.groupId && group.role === filter.data.role,
      );
    default:
      return false;
  }
}

/**
 * Endpoint responsible for managing Server-Sent Events (SSE) connections from authenticated users.
 *
 * Reference: https://html.spec.whatwg.org/multipage/server-sent-events.html
 */
export class SSEEndpoint extends UserEndpoint {
  static [INJECT] = [SSEService, ConfigService];

  private timerId?: ReturnType<typeof setInterval>;
  private clients = new Map<string, SSEClient>();

  constructor(sse: SSEService, configService: ConfigService) {
    super();

    configService.subscribe<Config>(
      {
        SSE_PING_INTERVAL_IN_SECONDS: {
          type: "number",
          minimum: 1,
          default: 30,
        },
      },
      (config) => {
        this.schedulePing(config.SSE_PING_INTERVAL_IN_SECONDS);
      },
    );

    sse.onEvent((event) => {
      // note: no Last-Event-ID support
      const payload = `event: ${event.type}\ndata: ${event.data !== undefined ? JSON.stringify(event.data) : ""}\n\n`;

      for (const [id, client] of this.clients.entries()) {
        if (isIncluded(event.filter, client.user)) {
          this.send(id, client, payload);
        }
      }
    });
  }

  private schedulePing(intervalInSeconds: number) {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    this.timerId = setInterval(() => {
      for (const [id, client] of this.clients.entries()) {
        if (client.lastMessage + intervalInSeconds * 1000 < Date.now()) {
          this.send(id, client, ": ping\n\n");
        }
      }
    }, intervalInSeconds * 1000);
  }

  private send(id: string, client: SSEClient, payload: string) {
    try {
      client.controller.enqueue(payload);
      client.lastMessage = Date.now();
    } catch {
      this.clients.delete(id);
    }
  }

  override close(): void | Promise<void> {
    if (this.timerId) {
      clearInterval(this.timerId);
    }

    for (const [_, client] of this.clients.entries()) {
      try {
        client.controller.close();
      } catch (e) {}
    }

    this.clients.clear();
  }

  protected handle(ctx: HttpContext) {
    const id = randomUUID();

    const stream = new ReadableStream({
      start: (controller) => {
        const client: SSEClient = {
          controller,
          user: ctx.user as ConnectedUser,
          lastMessage: Date.now(),
        };

        this.clients.set(id, client);

        ctx.signal.addEventListener("abort", () => {
          try {
            controller.close();
          } catch {}

          this.clients.delete(id);
        });

        // comment line used to ensure the connection is functional (will not fire on the client)
        this.send(id, client, ": connected\n\n");
      },
    });

    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
    });
  }
}
