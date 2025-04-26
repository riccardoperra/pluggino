import type { PluginContext } from "./plugin.js";
import type { Token } from "./type.js";

export const $PLUGIN_KEY: unique symbol = Symbol("plugin.key");
export const $PLUGIN_META: unique symbol = Symbol("plugin.meta");

export interface PluginKey<T, TMeta> {
  readonly ɵtype: T;
  readonly [$PLUGIN_KEY]: symbol;

  getMeta: (context: PluginContext) => TMeta;
}

export type PluginMeta<T> = Token<symbol, "ɵPluginMeta", T>;

export class ɵPluginKey<T, TMeta> implements PluginKey<T, TMeta> {
  readonly [$PLUGIN_KEY]: symbol;
  readonly ɵtype = undefined as T;

  constructor(meta: symbol) {
    this[$PLUGIN_KEY] = meta;
  }

  getMeta(context: PluginContext): TMeta {
    return context.get(this) as TMeta;
  }
}

export function makePluginKey<T, TMeta>(): PluginKey<T, TMeta> {
  return new ɵPluginKey(makePluginMeta());
}

export function makePluginMeta<TMeta>(): PluginMeta<TMeta> {
  return Symbol("plugin.meta") as PluginMeta<TMeta>;
}
