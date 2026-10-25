import { Miniflare } from "miniflare";
import { build } from "esbuild";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const entry = resolve("artifacts/workerd/worker.mjs");
const wasm = resolve("artifacts/workerd/lipat.wasm");
mkdirSync("artifacts/workerd", { recursive: true });
const bundled = await build({
  entryPoints: ["tests/workerd-entry.mjs"],
  bundle: true,
  format: "esm",
  platform: "neutral",
  external: ["./lipat.wasm"],
  write: false,
});
const code = bundled.outputFiles[0]?.text;
if (!code) throw new Error("Worker verification bundle is missing");
writeFileSync(entry, code);
const mf = new Miniflare({
  compatibilityDate: "2026-08-06",
  modules: [
    { type: "ESModule", path: entry, contents: code },
    {
      type: "CompiledWasm",
      path: wasm,
      contents: readFileSync("packages/lipat/dist/lipat.wasm"),
    },
  ],
});
try {
  const response = await mf.dispatchFetch("http://lipat.test/");
  const body = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(body));
  if (
    !body.scene.slides[0].elements.some(
      (e) =>
        e.text?.includes("Precompiled Worker WASM") &&
        e.animation?.effect === "fade",
    )
  )
    throw new Error("Worker PPTX import/export lost content or timing");
  if (
    body.byteInitializer.ok ||
    !body.byteInitializer.error.message.includes(
      "Wasm code generation disallowed",
    )
  )
    throw new Error(
      "Expected restricted runtime byte compilation: " +
        JSON.stringify(body.byteInitializer),
    );
  if (body.denied.ok || body.denied.error.reason !== "resourceLimit")
    throw new Error("Worker did not enforce native host policy");
  console.log(
    "workerd: precompiled module initializes and validates/compiles/exports/imports native PPTX; dynamic WASM byte compilation is denied.",
  );
} finally {
  await mf.dispose();
}
