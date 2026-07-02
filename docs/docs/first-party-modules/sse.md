# `@tymber/sse`

The `@tymber/sse` module provides Server-Sent Events (SSE) support for the Tymber framework, allowing you to push real-time updates from your server to authenticated clients.

## Installation

```bash
npm install @tymber/sse
```

## Usage

### Registration

Register the `SSEModule` in your application:

```ts
import { App } from "@tymber/core";
import { SSEModule } from "@tymber/sse";

const app = await App.create({
  modules: [
    SSEModule,
    // ...
  ],
});
```

The module automatically registers a `GET /api/events` endpoint that authenticated users can connect to.

### Sending Events

Inject the `SSEService` into your components or endpoints to send events to connected users:

```ts
import { Component, INJECT, type Context } from "@tymber/core";
import { SSEService } from "@tymber/sse";

export class MyService extends Component {
  static [INJECT] = [SSEService];

  constructor(private readonly sse: SSEService) {
    super();
  }

  public async notifyUser(ctx: Context, userId: string) {
    this.sse.toUser(userId).publish(ctx, "notification", {
      message: "Hello world!",
    });
  }
}
```

#### Targeting Options

The `SSEService` provides several methods to target specific recipients:

- `sse.publish(ctx, type, data?)`: Sends an event to **all** connected users.
- `sse.toUser(userId).publish(ctx, type, data?)`: Sends an event to a specific user.
- `sse.toUsersWithRole(role).publish(ctx, type, data?)`: Sends an event to all users with a specific role.
- `sse.toGroup(groupId).publish(ctx, type, data?)`: Sends an event to all users in a specific group.
- `sse.toGroupWithRole(groupId, role).publish(ctx, type, data?)`: Sends an event to users in a specific group with a specific role.

### Receiving Events

Clients can connect to the `/api/events` endpoint using the standard `EventSource` API:

```js
const eventSource = new EventSource("/api/events");

eventSource.addEventListener("notification", (event) => {
  const data = JSON.parse(event.data);
  console.log("Received notification:", data.message);
});

eventSource.onerror = (error) => {
  console.error("SSE error:", error);
};
```

:::caution

The module does not currently support `Last-Event-ID` replay. If a client disconnects, events sent while it is disconnected are not replayed automatically.

:::

## Configuration

The module can be configured via `ConfigService` with the following properties:

| Property                       | Description                                                                         | Default |
|--------------------------------|-------------------------------------------------------------------------------------|---------|
| `SSE_PING_INTERVAL_IN_SECONDS` | The interval at which the server sends a ping message to keep the connection alive. | `30`    |

## How it works

- **Authentication**: The `/api/events` endpoint requires an authenticated user.
- **Scalability**: The module uses `PubSubService` to broadcast events across multiple application instances, ensuring that users receive updates regardless of which instance they are connected to.
- **Ping/Keep-alive**: The server automatically sends periodic ping messages to prevent connection timeouts.
