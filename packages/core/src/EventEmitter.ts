import { createDebug } from "./utils/createDebug.js";

const debug = createDebug("EventEmitter");

type EventMap = Record<string, any>;
type EventKey<T extends EventMap> = string & keyof T;
type EventCallback<T> = (payload: T) => void;

export class EventEmitter<Events extends EventMap> {
  private listeners = new Map<
    keyof Events,
    Array<EventCallback<Events[keyof Events]>>
  >();

  on<K extends EventKey<Events>>(event: K, callback: EventCallback<Events[K]>) {
    debug("subscribing to event %s", event);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners
      .get(event)!
      .push(callback as EventCallback<Events[keyof Events]>);
  }

  emit<K extends EventKey<Events>>(event: K, payload: Events[K]) {
    debug("emitting event %s", event);
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(payload));
    }
  }
}
