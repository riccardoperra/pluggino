import { $PLUGIN, type Composable, Context, Plugin } from "./plugin";
import { emitter, type Emitter } from "./emitter";

export interface ResolveOptions {
  reservedProperties?: string[];
}

const DESTROY_EVENT = Symbol("plugin.destroy"),
  INIT_EVENT = Symbol("plugin.init");

export function resolve<T extends Composable<any>>(
  o: {},
  plugins: ReadonlyArray<Plugin>,
  options: ResolveOptions,
) {
  const reservedProperties = options?.reservedProperties ?? [];

  const context: ResolvePluginContext<T> = {
    object: o as T,
    emitter: emitter(),
    skipSet(property: string): boolean {
      if (reservedProperties.length > 0) {
        return reservedProperties.includes(property);
      }
      return false;
    },
  };

  const cleanup = () => {
    context.emitter.emit(DESTROY_EVENT);
  };

  for (let i = 0; i < plugins.length; i++) {
    resolvePlugin.call(context, plugins[i]);
  }

  context.emitter.emit(INIT_EVENT);

  return {
    object: context.object,
    cleanup,
  };
}

export interface ResolvePluginContext<T extends {}> {
  emitter: Emitter<{
    [INIT_EVENT]: () => void;
    [DESTROY_EVENT]: () => void;
  }>;

  object: T;

  skipSet(property: string): boolean;
}

function resolvePlugin<T extends {}>(
  this: ResolvePluginContext<T>,
  plugin: Plugin<Record<string, any>>,
) {
  const { emitter } = this,
    meta = plugin[$PLUGIN],
    context: Context = {
      onMount: (cb) => emitter.on(INIT_EVENT, () => cb(), { once: true }),
      onCleanup: (cb) => emitter.on(DESTROY_EVENT, () => cb(), { once: true }),
    };

  if (meta.onBeforeMount) {
    meta.onBeforeMount.call(this);
  }

  if (meta.onMount) {
    const fn = meta.onMount;
    context.onMount(fn);
  }

  const o = plugin.call(context, this.object, context);

  if (o) {
    for (const property in o) {
      if (this.skipSet(property)) continue;
      const descriptor = Object.getOwnPropertyDescriptor(o, property);
      if (descriptor) {
        Object.defineProperty(this.object, property, descriptor);
      } else {
        Reflect.set(this.object, property, o[property]);
      }
    }
  }

  if (meta.onDestroy) {
    const fn = meta.onDestroy;
    context.onCleanup(fn);
  }

  return this.object;
}
