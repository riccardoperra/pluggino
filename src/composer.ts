import { $PLUGIN, type Context, isPlugin, type Plugin } from "./plugin.js";
import { createPlugin } from "./create-plugin.js";

export class Composer<O extends {}> implements Composable<O> {
  readonly context: ComposerContext = {
    plugins: [],
  };

  with<T extends {} | void>(
    composerFn: (o: O, context: Context) => Exclude<T, typeof $PLUGIN> | void,
  ): void extends T ? this : Composer<O & T> {
    const plugin = composePlugin(composerFn);
    registerPlugin.call(this.context, plugin);
    return this as void extends T ? this : Composer<O & T>;
  }
}

export interface Composable<O extends {}> {
  context: ComposerContext;

  with<T extends {} | void>(
    composerFn: (o: O, context: Context) => Exclude<T, typeof $PLUGIN> | void,
  ): void extends T ? this : Composable<O & T>;
}

export function composePlugin(
  composerFn: ((o: any, context: Context) => any) | Plugin,
): Plugin {
  if (isPlugin(composerFn)) {
    return composerFn;
  }

  const name =
    composerFn.name || `plugin-${Math.random().toString(16).slice(2)}`;
  return createPlugin(composerFn, {
    name,
    dependencies: [],
  });
}

export interface ComposerContext {
  readonly plugins: Array<Plugin>;
}

export function registerPlugin<T extends Plugin>(
  this: ComposerContext,
  plugin: T,
): ComposerContext {
  this.plugins.push(plugin);
  return this;
}
