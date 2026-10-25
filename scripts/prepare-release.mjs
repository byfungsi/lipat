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
  "dist/motion.js",
  "dist/motion.d.ts",
  "dist/images.js",
  "dist/images.d.ts",
  "dist/native.js",
  "dist/native.d.ts",
  "dist/react-native.js",
  "dist/react-native.d.ts",
  "dist/editor.css",
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
const native = JSON.parse(
  readFileSync("packages/lipat-native/package.json", "utf8"),
);
if (native.version !== pkg.version)
  throw Error("Main/native package versions must match");
execFileSync("npm", ["run", "build", "-w", "@byfungsi/lipat-native"], {
  stdio: "inherit",
});
const nativePacked = JSON.parse(
  execFileSync(
    "npm",
    ["pack", "--json", "--pack-destination", "../../artifacts/release"],
    {
      cwd: "packages/lipat-native",
      encoding: "utf8",
    },
  ),
)[0];
writeFileSync(
  "artifacts/release/native-manifest.json",
  JSON.stringify(
    {
      name: native.name,
      version: native.version,
      filename: nativePacked.filename,
      integrity: nativePacked.integrity,
      shasum: nativePacked.shasum,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Prepared ${native.name}@${native.version}: artifacts/release/${nativePacked.filename}`,
);
execFileSync(
  process.execPath,
  [
    "scripts/check-native-consumer.mjs",
    `artifacts/release/${packed.filename}`,
    `artifacts/release/${nativePacked.filename}`,
  ],
  { stdio: "inherit" },
);
