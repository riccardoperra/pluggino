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
