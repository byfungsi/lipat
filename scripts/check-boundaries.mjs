import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
const allowed = {
  model: [],
  images: ["model"],
  motion: ["model"],
  core: ["model"],
  pptx: ["model", "images"],
  wasm: ["model"],
  render: ["model"],
  agent: ["core", "model", "render"],
  react: ["core", "model", "render"],
  reveal: ["model", "render"],
  lipat: [
    "model",
    "images",
    "motion",
    "core",
    "pptx",
    "wasm",
    "render",
    "agent",
    "react",
    "reveal",
  ],
};
function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(join(path, entry.name))
      : [join(path, entry.name)],
  );
}
for (const [name, dependencies] of Object.entries(allowed)) {
  for (const path of walk(`packages/${name}/src`).filter((p) =>
    /\.tsx?$/.test(p),
  )) {
    const source = readFileSync(path, "utf8");
    if (
      !["motion", "lipat"].includes(name) &&
      /from\s+["']motion(?:\/|["'])/.test(source)
    )
      throw new Error(`Motion dependency boundary violation: ${path}`);
    for (const match of source.matchAll(
      /from\s+["']@lipat-internal\/([^"']+)["']/g,
    )) {
      if (!dependencies.includes(match[1]))
        throw new Error(
          `Package boundary violation: ${path} imports ${match[1]}`,
        );
    }
    if (
      !["react", "wasm", "lipat"].includes(name) &&
      /from\s+["'](?:react|node:)/.test(source)
    )
      throw new Error(`Headless boundary violation: ${path}`);
  }
}
const pptx = readFileSync("crates/lipat-pptx/Cargo.toml", "utf8");
if (/lipat-author|lipat-layout/.test(pptx))
  throw new Error("PPTX adapter depends on authoring/layout");
console.log("TypeScript and Rust package boundaries verified.");
