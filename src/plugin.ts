export interface ContextHooks {
  readonly onInit: (fn: () => void) => void;
  readonly onDestroy: (fn: () => void) => void;
}

export function isPlugin(o: {}): o is Plugin {
  return $PLUGIN in o;
}

export interface CorePluginMeta<T> {
  name: string;

  dependencies?: string[];

  onBeforeMount?(): void;

  onMount?(): void;

  onDestroy?(): void;
}

export type PluginMeta<TMeta extends {}> = CorePluginMeta<unknown> & TMeta;

export type Plugin<
  Callback extends (o: any, context: any) => any = (
    o: any,
    context: any,
  ) => any,
  T = ReturnType<Callback>,
> = Callback & {
  [$PLUGIN]: PluginMeta<T & {}>;
};

export const $PLUGIN: unique symbol = Symbol("plugin");

export type Context<T = any> = {
  onMount: ContextHooks["onInit"];
  onCleanup: ContextHooks["onDestroy"];
};
