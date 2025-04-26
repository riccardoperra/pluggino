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

import { Composer, createPlugin, resolve } from "../src/index.js";

const composer = new Composer();

export interface Result<T> {
  resultFromMyPlugin: T;
  fromLastPlugin: {};
}

const myPlugin = <T>() =>
  createPlugin(
    (_, context): Result<T> => {
      return {
        resultFromMyPlugin: 1 as T,
        fromLastPlugin: {},
      };
    },
    {
      name: "myPlugin",
      dependencies: [],
    },
  );

const composable = composer
  .with(myPlugin<number>())
  .with((_) => {
    return {
      fromLastPlugin: _.resultFromMyPlugin,
      current: 1,
    };
  })
  .with((x) => {
    x.current = 8;
    return {
      fromLastPlugin2: x.resultFromMyPlugin,
      fromLastPlugin: "",
      current: "",
    };
  });

const resolved = resolve(
  composable,
  {},
  {
    reservedProperties: [],
  },
);
