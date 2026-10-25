import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createLipat, createDeck } from "../packages/lipat/dist/index.js";
const engine = createLipat(
  new Uint8Array(readFileSync("packages/wasm/lipat.wasm")),
);
if (!engine.ok) throw new Error(engine.error.message);
const imported = engine.value.parsePptx(
  new Uint8Array(readFileSync("tests/fixtures/python-pptx.pptx")),
);
if (!imported.ok) throw new Error(imported.error.message);
const exported = engine.value.writePptx(imported.value.scene);
if (!exported.ok) throw new Error(exported.error.message);
mkdirSync("artifacts", { recursive: true });
writeFileSync("artifacts/interop.pptx", exported.value.bytes);
execFileSync(
  process.env.LIPAT_PYTHON ?? "python3",
  ["scripts/verify-interop.py", "artifacts/interop.pptx"],
  { stdio: "inherit" },
);
