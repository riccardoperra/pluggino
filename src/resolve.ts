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

import { $PLUGIN, type Context, type Plugin } from "./plugin.js";
import { emitter, type Emitter } from "./emitter.js";
import type { Composable } from "./composer.js";

export interface ResolveOptions {
  reservedProperties?: string[];
}

const DESTROY_EVENT: unique symbol = Symbol("plugin.destroy")
const INIT_EVENT: unique symbol = Symbol("plugin.init");

export interface ComposedObject<T> {
  object: T;
  dispose: () => void;
}

export interface ResolvePluginContext<T extends {}> {
  emitter: Emitter<{
    [INIT_EVENT]: () => void;
    [DESTROY_EVENT]: () => void;
  }>;

  object: T;

  skipSet(property: string): boolean;
}

export function resolve<T extends {}>(
  composable: Composable<T>,
  o: any,
  options: ResolveOptions,
): ComposedObject<T> {
  const plugins = composable.context.plugins;
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

  const dispose = () => {
    context.emitter.emit(DESTROY_EVENT);
  };

  for (let i = 0; i < plugins.length; i++) {
    resolvePlugin.call(context, plugins[i]);
  }

  context.emitter.emit(INIT_EVENT);

  return {
    object: context.object as any,
    dispose,
  };
}

function resolvePlugin<T extends {}>(
  this: ResolvePluginContext<T>,
  plugin: Plugin,
): unknown {
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
