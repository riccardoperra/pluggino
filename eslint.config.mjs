// @ts-check

import { tanstackConfig } from "@tanstack/config/eslint";
import unusedImports from "eslint-plugin-unused-imports";
import * as tseslint from "typescript-eslint";

export default [
  ...tanstackConfig,
  // ...tseslint.config({
  //   plugins: {
  //     "unused-imports": unusedImports,
  //   },
  //   rules: {
  //     "no-case-declarations": "off",
  //     "no-shadow": "off",
  //     "@typescript-eslint/naming-convention": "off",
  //     "@typescript-eslint/no-empty-function": "off",
  //     "@typescript-eslint/no-unsafe-function-type": "off",
  //     "unused-imports/no-unused-imports": "warn",
  //   },
  // }),
];
