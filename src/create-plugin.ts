/*
 * Copyright 2025 Riccardo Perra
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { $PLUGIN } from "./plugin.js";
import { $PLUGIN_KEY, makePluginKey } from "./plugin-key.js";
import type { Plugin, PluginContext, PluginMeta } from "./plugin.js";
import type { PluginKey } from "./plugin-key.js";
import type { SystemFactoryTypes } from "./system.js";

export type CreatePluginOptions = {
  key?: PluginKey<any, any>;
  name: string;
  onBeforeMount?: () => void;
  onMount?: () => void;
  onDestroy?: () => void;
};

export type CreatePluginFactory<
  TSystemTypes extends SystemFactoryTypes = SystemFactoryTypes,
> = <
  TCallback extends <TObject>(
    o: TObject,
    context: PluginContext<TObject>,
  ) => unknown,
>(
  callback: TCallback,
  options: TSystemTypes["pluginOptions"],
) => Plugin<TCallback>;

export const createPlugin: CreatePluginFactory = function createPlugin<
  TCallback extends <TObject>(
    o: TObject,
    context: PluginContext<TObject>,
  ) => unknown,
>(composer: TCallback, options: CreatePluginOptions): Plugin<TCallback> {
  const meta: PluginMeta<any> = {
    // Allow any type of given options to be passed
    ...options,
    name: options.name,
    onBeforeMount: options.onBeforeMount,
    onMount: options.onMount,
    onDestroy: options.onDestroy,
  };

  const plugin = Object.assign(composer, {
    [$PLUGIN]: meta,
    [$PLUGIN_KEY]: options.key || makePluginKey(),
  });

  if (!plugin.name) {
    Object.defineProperty(plugin, "name", { value: options.name });
  }

  return plugin;
};

export function createPluginFactory<
  TOptions extends CreatePluginOptions,
>(): CreatePluginFactory<TOptions> {
  return createPlugin;
}
