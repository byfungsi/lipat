import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
execFileSync(
  "cargo",
  [
    "build",
    "--locked",
    "--release",
    "--target",
    "wasm32-unknown-unknown",
    "-p",
    "lipat-wasm",
    "--lib",
  ],
  { stdio: "inherit" },
);
mkdirSync("packages/wasm", { recursive: true });
copyFileSync(
  "target/wasm32-unknown-unknown/release/lipat_wasm.wasm",
  "packages/wasm/lipat.wasm",
);
