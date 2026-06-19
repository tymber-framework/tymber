import {
  Component,
  type Context,
  EventEmitter,
  type GroupId,
  type GroupRole,
  INJECT,
  PubSubService,
  type UserId,
  type UserRole,
} from "@tymber/core";

export type Filter =
  | {
      type: "all";
    }
  | {
      type: "user";
      data: {
        userId: UserId;
      };
    }
  | {
      type: "role";
      data: {
        role: UserRole;
      };
    }
  | {
      type: "group";
      data: {
        groupId: GroupId;
      };
    }
  | {
      type: "group-role";
      data: {
        groupId: GroupId;
        role: GroupRole;
      };
    };

export interface ServerSentEvent {
  type: string;
  data: unknown;
  filter: Filter;
}

export class SSEService extends Component {
  static override [INJECT] = [PubSubService];

  private emitter = new EventEmitter<{
    sse: ServerSentEvent;
  }>();

  constructor(private readonly pubSubService: PubSubService) {
    super();
    pubSubService.subscribe("sse", (event: ServerSentEvent) => {
      this.emitter.emit("sse", event);
    });
  }

  onEvent(listener: (event: ServerSentEvent) => void) {
    this.emitter.on("sse", listener);
  }

  toUser(userId: UserId) {
    return new SSEPublisher(this.emitter, this.pubSubService, {
      type: "user",
      data: { userId },
    });
  }

  toUsersWithRole(role: UserRole) {
    return new SSEPublisher(this.emitter, this.pubSubService, {
      type: "role",
      data: { role },
    });
  }

  toGroup(groupId: GroupId) {
    return new SSEPublisher(this.emitter, this.pubSubService, {
      type: "group",
      data: { groupId },
    });
  }

  toGroupWithRole(groupId: GroupId, role: GroupRole) {
    return new SSEPublisher(this.emitter, this.pubSubService, {
      type: "group-role",
      data: { groupId, role },
    });
  }

  public publish(ctx: Context, type: string, data?: unknown) {
    return new SSEPublisher(this.emitter, this.pubSubService, {
      type: "all",
    }).publish(ctx, type, data);
  }
}

class SSEPublisher {
  constructor(
    private readonly emitter: EventEmitter<{
      sse: ServerSentEvent;
    }>,
    private readonly pubSubService: PubSubService,
    private readonly filter: Filter,
  ) {}

  public publish(ctx: Context, type: string, data?: unknown) {
    // notify connected clients on this instance
    this.emitter.emit("sse", {
      type,
      data,
      filter: this.filter,
    });

    // notify other instances
    this.pubSubService.publish(ctx, "sse", {
      type,
      data,
      filter: this.filter,
    });
  }
}
