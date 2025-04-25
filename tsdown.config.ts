import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  minify: true,
  entry: ["./src/index.ts"],
  dts: true,
});
