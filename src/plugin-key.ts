import type { PluginContext } from "./plugin.js";

export const $PLUGIN_KEY: unique symbol = Symbol("plugin.key");
export const $PLUGIN_META: unique symbol = Symbol("plugin.meta");

export interface PluginKey<T, TMeta> {
  readonly ɵtype: T;
  readonly ɵmeta: PluginKeyMeta<TMeta>;
  readonly [$PLUGIN_KEY]: PluginKeyMeta<TMeta>;

  getMeta: (context: PluginContext) => TMeta;
}

export type PluginKeyMeta<T> = symbol & {
  readonly [$PLUGIN_META]: T;
};

export function makePluginKey<T, TMeta>(
  key: string = "key",
): PluginKey<T, TMeta> {
  return {
    [$PLUGIN_KEY]: makePluginMeta<TMeta>(key),
    ɵtype: undefined as T,
    get ɵmeta() {
      return this[$PLUGIN_KEY];
    },
    getMeta(context: PluginContext) {
      return context.getMeta(this);
    },
  };
}

export function makePluginMeta<TMeta>(
  key: string = "key",
): PluginKeyMeta<TMeta> {
  return Object.assign(Symbol(`plugin.meta/${key}`), {
    [$PLUGIN_META]: undefined as TMeta,
  });
}
