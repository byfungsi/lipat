import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "es2022",
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    "expo-modules-core",
    "@byfungsi/lipat/native",
    "@byfungsi/lipat/model",
  ],
});
