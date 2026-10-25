import { execFileSync } from "node:child_process";
import { format } from "prettier";
import { writeFileSync } from "node:fs";
const output = execFileSync(
  "cargo",
  ["run", "--quiet", "--locked", "-p", "lipat-wasm", "--bin", "lipat-schema"],
  { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
);
writeFileSync(
  "packages/agent/src/schemas.json",
  await format(output, { parser: "json" }),
);
