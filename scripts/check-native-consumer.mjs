import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { build } from "esbuild";

const folder = mkdtempSync(join(tmpdir(), "lipat-native-consumer-"));
try {
  writeFileSync(
    join(folder, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  execFileSync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--legacy-peer-deps",
      "--no-audit",
      "--no-fund",
      ...process.argv.slice(2).map((path) => resolve(path)),
    ],
    { cwd: folder, stdio: "pipe" },
  );
  const source = `import { createNativeLipat } from '@byfungsi/lipat-native';
import { createDeckEditorSession, createDeck } from '@byfungsi/lipat/core';
const engine = createNativeLipat({limits:{maxNodes:100}});
if(engine.ok){const result=createDeck({id:'native',slides:[{id:'s',content:{id:'t',type:'text',text:'Native consumer'}}]},{engine:engine.value});
if(result.ok)createDeckEditorSession(result.value,{onSave:document=>{JSON.stringify(document)}});}`;
  writeFileSync(join(folder, "consumer.ts"), source);
  writeFileSync(
    join(folder, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        noEmit: true,
        lib: ["ES2022"],
        types: [],
      },
      include: ["consumer.ts"],
    }),
  );
  execFileSync(
    process.execPath,
    [
      resolve("node_modules/typescript/bin/tsc"),
      "-p",
      join(folder, "tsconfig.json"),
    ],
    { stdio: "inherit" },
  );
  const bundle = await build({
    stdin: { contents: source, resolveDir: folder, loader: "ts" },
    bundle: true,
    platform: "neutral",
    format: "esm",
    external: ["expo-modules-core"],
    write: false,
    metafile: true,
  });
  if (
    Object.keys(bundle.metafile.inputs).some((path) =>
      /wasm-engine|react-native|react\/|motion\//.test(path),
    )
  )
    throw Error(
      "Packed native engine adapter imported unrelated platform dependencies",
    );
  console.log(
    "Packed native add-on and main SDK resolve and typecheck together without DOM, React, WASM or private workspaces.",
  );
} finally {
  rmSync(folder, { recursive: true, force: true });
}
