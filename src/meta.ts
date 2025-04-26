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

import { $PLUGIN_KEY } from "./plugin-key.js";
import type { PluginKey } from "./plugin-key.js";

export interface WithMeta {
  getMeta: {
    /**
     * Retrieve a metadata property for a given name or plugin.
     *
     * @param key
     */ <T = any>(key: string): T;
    /**
     * Retrieve a metadata property for a given plugin key.
     *
     * @param key The plugin key
     */ <TMeta>(key: PluginKey<unknown, TMeta>): TMeta;
  };

  setMeta: {
    /**
     * Store a metadata property in the global context, keyed by the name
     *
     * @param key The name of the property
     * @param value The value of the property
     */ <T = any>(key: string, value: T): void;
    /**
     * Store a metadata property in the global context, keyed by plugin reference
     *
     * @param key The plugin key
     * @param value The value of the property
     */ <TMeta>(key: PluginKey<unknown, TMeta>, value: TMeta): void;
  };
}

export type MetaStore = Record<PropertyKey, PluginKey<any, any>>;

export function getMeta(
  this: MetaStore,
  ...args: [key: string] | [key: PluginKey<unknown, unknown>]
) {
  return this[typeof args[0] === "string" ? args[0] : args[0][$PLUGIN_KEY]];
}

export function setMeta(
  this: MetaStore,
  ...args:
    | [key: string, value: unknown]
    | [key: PluginKey<any, any>, value: any]
) {
  this[typeof args[0] === "string" ? args[0] : args[0][$PLUGIN_KEY]] = args[1];
}
