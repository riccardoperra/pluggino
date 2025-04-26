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
import type { Context, Plugin, PluginMeta } from "./plugin.js";

type CreatePluginOptions = {
  name: string;
  dependencies?: ReadonlyArray<string>;
  onBeforeMount?: () => void;
  onMount?: () => void;
  onDestroy?: () => void;
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
  TCallback extends <TObject>(o: TObject, context: Context<TObject>) => unknown,
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
