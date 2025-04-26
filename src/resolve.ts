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

export interface ResolveOptions<T> {
  reservedProperties?: Array<string>;
  createContext?: () => Record<string, any>;
  beforePluginMount?: InternalEvents<T>[typeof BEFORE_PLUGIN_MOUNT];
  afterPluginMount?: InternalEvents<T>[typeof AFTER_PLUGIN_MOUNT];
}

const DESTROY_EVENT: unique symbol = Symbol("plugin.destroy");
const INIT_EVENT: unique symbol = Symbol("plugin.init");
const BEFORE_PLUGIN_MOUNT: unique symbol = Symbol("plugin.init");
const AFTER_PLUGIN_MOUNT: unique symbol = Symbol("plugin.init");

export interface ComposedObject<T> {
  object: T;
  dispose: () => void;
}

export interface InternalEvents<T> {
  [BEFORE_PLUGIN_MOUNT]: (
    context: ResolvePluginContext<T>,
    plugin: Plugin,
    index: number,
  ) => void;
  [AFTER_PLUGIN_MOUNT]: (
    context: ResolvePluginContext<T>,
    data: {
      plugin: Plugin;
      result: unknown;
      object: T;
    },
    index: number,
  ) => void;
}

export interface ResolvePluginContext<T> extends WithMeta {
  emitter: Emitter<{
    [INIT_EVENT]: () => void;
    [DESTROY_EVENT]: () => void;
  }>;

  object: T;

  skipSet: (property: string) => boolean;

  refs: WeakMap<PluginKey<any, any>, { plugin: Plugin; result: object }>;

  getContext: () => Record<string, any>;

  meta: Record<string, unknown>;
}

export interface ResolvedPluginRef {
  plugin: Plugin;
  result: object;
  meta: Record<string, any>;
}

export function resolve<T extends {}>(
  composable: Composable<T>,
  o: any,
  options: ResolveOptions<T>,
): ComposedObject<T> {
  const metadata: MetaStore = {},
    plugins = composable.context.plugins,
    reservedProperties = options.reservedProperties ?? [],
    refs = new WeakMap<PluginKey<any, any>, ResolvedPluginRef>(),
    createContext = options.createContext ?? (() => ({})),
    e = emitter<InternalEvents<T>>();

  const context: ResolvePluginContext<T> = {
    object: o as T,
    emitter: e as ResolvePluginContext<T>["emitter"],
    getMeta: getMeta.bind(metadata),
    setMeta: setMeta.bind(metadata),
    skipSet: (property: string): boolean => {
      if (reservedProperties.length > 0) {
        return reservedProperties.includes(property);
      }
      return false;
    },
    refs,
    meta: {},
    getContext: createContext,
  };

  if (options.beforePluginMount)
    e.on(BEFORE_PLUGIN_MOUNT, options.beforePluginMount);
  if (options.afterPluginMount)
    e.on(AFTER_PLUGIN_MOUNT, options.afterPluginMount);

  const dispose = () => context.emitter.emit(DESTROY_EVENT);

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    e.emit(BEFORE_PLUGIN_MOUNT, context, plugin, i);
    const { object, callResult } = resolvePlugin.call(context, plugin);
    e.emit(
      AFTER_PLUGIN_MOUNT,
      context,
      {
        plugin,
        result: callResult,
        object: object as T,
      },
      i,
    );
  }

  context.emitter.emit(INIT_EVENT);

  return {
    object: context.object,
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
    onMount: (cb) => this.emitter.on(INIT_EVENT, () => cb(), { once: true }),
    onDispose: (cb) =>
      this.emitter.on(DESTROY_EVENT, () => cb(), { once: true }),
    get: (p) => (this.refs.get(p)?.result as any | null) ?? null,
    getMeta: this.getMeta,
    setMeta: this.setMeta,
    ...this.getContext(),
  };

  if (meta.onBeforeMount) {
    meta.onBeforeMount.call(this);
  }

  if (meta.onMount) {
    const fn = meta.onMount;
    context.onMount(fn);
  }

  if (meta.onDestroy) {
    const fn = meta.onDestroy;
    context.onDispose(fn);
  }

  const r = plugin.call(context, this.object, context);
  const result = { object: this.object, callResult: r };
  if (!r) return result;
  const keys = Object.keys(r);
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (this.skipSet(k)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(r, k);
    if (descriptor) {
      Object.defineProperty(this.object, k, descriptor);
    } else {
      Reflect.set(this.object, k, r[k]);
    }
  }
  this.refs.set(pluginKey, { plugin, result: r });
  return result;
}
