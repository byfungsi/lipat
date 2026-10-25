import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const pkg = JSON.parse(readFileSync("packages/lipat/package.json", "utf8"));
if (pkg.name !== "@byfungsi/lipat" || pkg.private)
  throw new Error("Release must target the public @byfungsi/lipat package");
execFileSync("npm", ["run", "verify"], { stdio: "inherit" });
mkdirSync("artifacts/release", { recursive: true });
const packed = JSON.parse(
  execFileSync(
    "npm",
    ["pack", "--json", "--pack-destination", "../../artifacts/release"],
    { cwd: "packages/lipat", encoding: "utf8" },
  ),
)[0];
for (const path of [
  "dist/lipat.wasm",
  "dist/index.js",
  "dist/index.d.ts",
  "README.md",
  "LICENSE",
])
  if (!packed.files.some((f) => f.path === path))
    throw new Error("Release archive is missing " + path);
writeFileSync(
  "artifacts/release/manifest.json",
  JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version,
      filename: packed.filename,
      integrity: packed.integrity,
      shasum: packed.shasum,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Prepared ${pkg.name}@${pkg.version}: artifacts/release/${packed.filename}`,
);
