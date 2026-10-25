import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
const names = [
  "model",
  "browser-playback",
  "engine",
  "native",
  "react-native",
  "core",
  "pptx",
  "react",
  "wasm",
  "agent",
  "reveal",
  "render",
  "motion",
  "images",
];
export default defineConfig({
  resolve: {
    alias: Object.fromEntries([
      ...names.map((name) => [
        `@lipat-internal/${name}`,
        resolve(
          `packages/${name}/src/index.${name === "react" ? "tsx" : "ts"}`,
        ),
      ]),
      ...names.map((name) => [
        `@byfungsi/lipat/${name}`,
        resolve(`packages/lipat/src/${name}.ts`),
      ]),
      ["@byfungsi/lipat", resolve("packages/lipat/src/index.ts")],
    ]),
  },
  test: {
    include: ["packages/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
  },
});
