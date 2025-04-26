import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  minify: false,
  sourcemap: true,
  fixedExtension: true,
  entry: ["./src/index.ts"],
  dts: true,
});
