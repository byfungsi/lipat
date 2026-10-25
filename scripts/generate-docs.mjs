import {
  readdirSync,
  cpSync,
  rmSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
} from "node:fs";
import { join } from "node:path";
rmSync("docs/public/types", { recursive: true, force: true });
mkdirSync("docs/public/types", { recursive: true });
for (const name of readdirSync("packages/lipat/dist").filter((n) =>
  n.endsWith(".d.ts"),
))
  copyFileSync(
    join("packages/lipat/dist", name),
    join("docs/public/types", name),
  );
mkdirSync("docs/public/markdown", { recursive: true });
const pages = readdirSync("docs")
  .filter((f) => f.endsWith(".md"))
  .sort();
for (const page of pages)
  copyFileSync(join("docs", page), join("docs/public/markdown", page));
writeFileSync(
  "docs/public/llms.txt",
  "# Lipat\n\nAgent-friendly semantic slide authoring and an independent PPTX adapter.\n\n" +
    pages.map((p) => `- [${p.replace(".md", "")}](markdown/${p})`).join("\n") +
    "\n",
);
writeFileSync(
  "docs/public/llms-full.txt",
  pages.map((p) => readFileSync(join("docs", p), "utf8")).join("\n\n---\n\n"),
);
writeFileSync(
  "docs/public/manifest.json",
  JSON.stringify(
    {
      version: 1,
      package: "@byfungsi/lipat",
      pages: pages.map((p) => `markdown/${p}`),
    },
    null,
    2,
  ) + "\n",
);
copyFileSync("packages/agent/src/schemas.json", "docs/public/schemas.json");

rmSync("docs/public/playground", { recursive: true, force: true });
cpSync("examples/react-demo/dist", "docs/public/playground", {
  recursive: true,
});
