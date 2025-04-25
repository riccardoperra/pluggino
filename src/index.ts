import { $PLUGIN, Composer, Plugin } from "./plugin";
import { createPlugin } from "./create-plugin";
import { resolve } from "./resolve";

const composer = new Composer();

const fnx = (o: { innerPlugin: number }) => {
  return {
    number: 2,
  };
};

const myPlugin = <S>() =>
  createPlugin(
    (_, context) => {
      context.onMount(() => {
        console.log("get mounted plugin custom");
      });

      return {
        resultFromMyPlugin: 1 as S,
      };
    },
    {
      name: "myPlugin",
      dependencies: [],
    },
  );

const composable = composer.with(myPlugin<number>());

const resolved = resolve({}, composable.context.plugins, {
  reservedProperties: [],
});
console.log(resolved);
