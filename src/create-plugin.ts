import {
  $PLUGIN,
  type Context,
  type Plugin,
  type PluginMeta,
} from "./plugin.js";

type CreatePluginOptions = {
  name: string;
  dependencies?: string[];
  onBeforeMount?(): void;
  onMount?(): void;
  onDestroy?(): void;
};

/**
 * A function that creates a plugin for a generic store API.
 *
 * @template TStore - The type of the store API that this plugin is for.
 * @template Extension - The type of the extension that this plugin adds to the store.
 * @param composer - The function that will be called when the plugin is applied.
 * @param options - The options for creating the plugin.
 * @returns A plugin object with the given name and dependencies and the apply function provided.
 */
export function createPlugin<
  TCallback extends <O>(o: O, context: Context<O>) => unknown,
>(composer: TCallback, options: CreatePluginOptions): Plugin<TCallback> {
  const meta: PluginMeta<any> = {
    name: options.name,
    dependencies: options.dependencies,
    onBeforeMount: options.onBeforeMount,
    onMount: options.onMount,
    onDestroy: options.onDestroy,
  };

  return Object.assign(composer, {
    [$PLUGIN]: meta,
  });
}
