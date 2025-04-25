interface EventsMap {
  [event: string | symbol]: any;
}

interface DefaultEvents extends EventsMap {
  [event: string]: (...args: any) => void;
}

export interface Unsubscribe {
  (): void;
}

export interface Emitter<Events extends EventsMap = DefaultEvents> {
  emit<K extends keyof Events>(
    this: this,
    event: K,
    ...args: Parameters<Events[K]>
  ): void;

  events: Partial<{ [E in keyof Events]: Events[E][] }>;

  on<K extends keyof Events>(
    this: this,
    event: K,
    cb: Events[K],
    options?: { once: boolean },
  ): Unsubscribe;
}

export function emitter<
  Events extends EventsMap = DefaultEvents,
>(): Emitter<Events> {
  return {
    emit(event, ...args) {
      const callbacks = this.events[event] || [];
      for (let i = 0, length = callbacks.length; i < length; i++) {
        callbacks[i](...args);
      }
    },
    events: {},
    on(event, _cb, options) {
      const cb = !options?.once
        ? _cb
        : (((...args: any[]) => {
            _cb(...args);
            cleanup();
          }) as typeof _cb);
      (this.events[event] ||= []).push(cb);
      const cleanup = () => {
        this.events[event] = this.events[event]?.filter((i) => cb !== i);
      };
      return cleanup;
    },
  };
}
