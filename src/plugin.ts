export interface PluginHooks<T> {
  readonly onBeforeInit?: Array<() => void>;
  readonly onInit?: Array<() => void>;
  readonly onBeforeDestroy?: Array<() => void>;
  readonly onDestroy?: Array<() => void>;
}

export interface ContextHooks {
  readonly onInit: (fn: () => void) => void;
  readonly onDestroy: (fn: () => void) => void;
}

export function isPlugin<T extends {}>(o: {}): o is Plugin {
  return $PLUGIN in o;
}

export interface CorePluginMeta<T> {
  _: () => T;

  name: string;

  dependencies?: string[];

  onBeforeMount?(): void;

  onMount?(): void;

  onDestroy?(): void;
}

export type PluginMeta<TMeta extends {}> = CorePluginMeta<unknown> & TMeta;

export type PluginCallback<Callback extends (o: any, context: any) => any> =
  Callback;

export type Plugin<
  Callback extends (o: any, context: any) => any = (
    o: any,
    context: any,
  ) => any,
  T = ReturnType<Callback>,
> = Callback & {
  [$PLUGIN]: PluginMeta<T & {}>;
};

export const $PLUGIN = Symbol("plugin");

export interface ComposerContext {
  readonly pluginNames: Set<string>;
  readonly plugins: Array<Plugin>;
}

export function registerPlugin<T extends Plugin>(
  this: ComposerContext,
  plugin: T,
) {
  this.plugins.push(plugin);
  return this;
}

export type Context<T = any> = {
  onMount: ContextHooks["onInit"];
  onCleanup: ContextHooks["onDestroy"];
};

type Merge<T, U> = keyof T & keyof U extends never
  ? T & U
  : Omit<T, keyof T & keyof U> & U;

export interface Composable<O extends {}> {
  with<T extends {} | void>(
    composerFn: (o: O, context: Context) => Exclude<T, typeof $PLUGIN> | void,
  ): void extends T ? this : Composable<O & T>;
}

export class Composer<O extends {}> implements Composable<O> {
  readonly context: ComposerContext = {
    pluginNames: new Set<string>(),
    plugins: [],
  };

  with<T extends {} | void>(
    composerFn: (o: O, context: Context) => T | void,
  ): void extends T ? this : Composer<O & T> {
    let plugin: Plugin;
    if (isPlugin(composerFn)) {
      plugin = composerFn;
    } else {
      function fn(...args: any[]) {
        return composerFn(...args);
      }

      plugin = Object.assign(fn, {
        [$PLUGIN]: {},
        pluginName: `plugin-${Math.random()}`,
        dependencies: [],
        hooks: {},
      }) as Plugin<T>;
    }
    registerPlugin.call(this.context, plugin);
    return this;
  }
}
