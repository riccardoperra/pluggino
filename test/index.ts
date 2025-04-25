import { Composer, createPlugin, resolve } from "../src/index.js";

const composer = new Composer();

export interface Result<S> {
  resultFromMyPlugin: S;
  fromLastPlugin: {};
}

const myPlugin = <S>() =>
  createPlugin(
    (_, context): Result<S> => {
      return {
        resultFromMyPlugin: 1 as S,
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
