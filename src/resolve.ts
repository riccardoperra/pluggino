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
import { emitter } from "./emitter.js";
import { $PLUGIN_KEY } from "./plugin-key.js";
import { getMeta, setMeta } from "./meta.js";
import type { MetaStore, WithMeta } from "./meta.js";
import type { PluginKey } from "./plugin-key.js";
import type { Plugin, PluginContext } from "./plugin.js";
import type { Emitter } from "./emitter.js";
import type { Composable } from "./composer.js";

export interface ResolveOptions {
  reservedProperties?: Array<string>;
}

const DESTROY_EVENT: unique symbol = Symbol("plugin.destroy");
const INIT_EVENT: unique symbol = Symbol("plugin.init");

export interface ComposedObject<T> {
  object: T;
  dispose: () => void;
}

export interface ResolvePluginContext<T extends {}> extends WithMeta {
  emitter: Emitter<{
    [INIT_EVENT]: () => void;
    [DESTROY_EVENT]: () => void;
  }>;

  object: T;

  skipSet: (property: string) => boolean;

  refs: WeakMap<
    PluginKey<any, any>,
    {
      plugin: Plugin;
      result: object;
      meta: Record<string, any>;
    }
  >;
}

export function resolve<T extends {}>(
  composable: Composable<T>,
  o: any,
  options: ResolveOptions,
): ComposedObject<T> {
  const plugins = composable.context.plugins;
  const reservedProperties = options.reservedProperties ?? [];

  const metadata: MetaStore = {};

  const refs = new WeakMap<
    PluginKey<any, any>,
    {
      plugin: Plugin;
      result: object;
      meta: Record<string, any>;
    }
  >();

  const context: ResolvePluginContext<T> = {
    object: o as T,
    emitter: emitter(),
    getMeta: getMeta.bind(metadata),
    setMeta: setMeta.bind(metadata),
    skipSet: (property: string): boolean => {
      if (reservedProperties.length > 0) {
        return reservedProperties.includes(property);
      }
      return false;
    },
    refs,
  };

  const dispose = () => {
    context.emitter.emit(DESTROY_EVENT);
  };

  for (const plugin of plugins) {
    resolvePlugin.call(context, plugin);
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
) {
  const meta = plugin[$PLUGIN],
    pluginKey = plugin[$PLUGIN_KEY];

  const context: PluginContext = {
    onMount: (cb) => {
      this.emitter.on(INIT_EVENT, () => cb(), { once: true });
    },
    onDispose: (cb) => {
      this.emitter.on(DESTROY_EVENT, () => cb(), { once: true });
    },
    get: (p) => {
      const ref = this.refs.get(p);
      if (!ref) return null;
      return ref.result as any;
    },
    getMeta: this.getMeta.bind(this.getMeta),
    setMeta: this.setMeta.bind(this.setMeta),
  };

  const ownPluginMeta: Record<string, any> = {};

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
      if (this.skipSet(property)) {
        delete o[property];
        continue;
      }
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
    context.onDispose(fn);
  }

  this.refs.set(pluginKey, {
    plugin,
    result: o,
    meta: ownPluginMeta,
  });

  return {
    object: this.object,
    callResult: o,
  };
}
