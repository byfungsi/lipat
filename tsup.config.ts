import { defineConfig } from "tsup";
export default defineConfig({
  entry: [
    "src/index.ts",
    "src/model.ts",
    "src/core.ts",
    "src/pptx.ts",
    "src/react.ts",
    "src/wasm.ts",
    "src/native.ts",
    "src/react-native.ts",
    "src/agent.ts",
    "src/reveal.ts",
    "src/render.ts",
    "src/motion.ts",
    "src/images.ts",
  ],
  format: ["esm"],
  target: "es2022",
  dts: { compilerOptions: { baseUrl: "../.." } },
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  noExternal: [/^@lipat-internal\//],
  external: [
    "react",
    "react/jsx-runtime",
    "motion",
    "react-native",
    "react-native-svg",
    "expo-modules-core",
  ],
  tsconfig: "../../tsconfig.json",
  onSuccess: async () => {
    const { copyFile } = await import("node:fs/promises");
    await copyFile("../wasm/lipat.wasm", "dist/lipat.wasm");
    await copyFile("../react/src/editor.css", "dist/editor.css");
    await copyFile("../../README.md", "README.md");
    await copyFile("../../LICENSE", "LICENSE");
  },
});
