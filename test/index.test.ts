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

import {
  Composer,
  createPlugin,
  makePluginKey,
  makePluginMeta,
  resolve,
} from "../src/index.js";

const composer = new Composer();

export interface Result<T> {
  resultFromMyFirstPlugin: T;
}

const myPlugin1Key = makePluginKey<Result<number>, { test: number }>();
const meta2 = makePluginMeta<string>();

const myPlugin = <T>() =>
  createPlugin(
    function plugin123(_, context): Result<T> {
      return {
        resultFromMyFirstPlugin: 1 as T,
      };
    },
    {
      name: "myPlugin",
      key: myPlugin1Key,
    },
  );

const composable = composer
  .with(myPlugin<number>())
  .with(function secondPlugin(_, context) {
    context.setMeta("foo", "bar");

    const data = {
      fromLastPlugin: _.resultFromMyFirstPlugin,
      current: 1,
    };
    return data;
  })
  .with(function test1(x, context) {
    return {
      fromLastPlugin2: 123,
    };
  });

const fnx = function fn() {
  console.log("test");
  return 3;
};
const objec = Object.assign(fnx, {
  set(): void {
    console.log("testing");
  },
});

const resolved = resolve(composable, objec, {
  reservedProperties: [],
});

console.dir(resolved.object);
