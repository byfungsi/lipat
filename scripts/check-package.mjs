import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const folder = mkdtempSync(join(tmpdir(), "lipat-consumer-"));
try {
  const packed = JSON.parse(
    execFileSync("npm", ["pack", "--json", "--pack-destination", folder], {
      cwd: "packages/lipat",
      encoding: "utf8",
    }),
  )[0];
  writeFileSync(
    join(folder, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  execFileSync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      join(folder, packed.filename),
    ],
    { cwd: folder, stdio: "pipe" },
  );
  writeFileSync(
    join(folder, "consumer.mjs"),
    `import {readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';
import {createLipat,createDeck} from '@byfungsi/lipat';
const engine=createLipat(new Uint8Array(readFileSync(fileURLToPath(import.meta.resolve('@byfungsi/lipat/lipat.wasm')))));
if(!engine.ok)throw new Error(engine.error.message);
const deck=createDeck({id:'consumer',slides:[{id:'s',content:{id:'title',type:'heading',text:'Packed consumer'}}]},{engine:engine.value});
if(!deck.ok||!deck.value.compile().ok)throw new Error('Packed runtime failed');export const runtime=deck.value;
for(const subpath of ['model','core','pptx','wasm','render','agent','reveal'])await import('@byfungsi/lipat/'+subpath);
if(process.env.LIPAT_CHECK_NO_REACT==='1')try{await import('react');throw new Error('React was installed unexpectedly')}catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
if(process.env.LIPAT_CHECK_NO_REACT==='1')try{await import('motion');throw new Error('Motion was installed unexpectedly')}catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
`,
  );
  execFileSync("node", ["consumer.mjs"], {
    cwd: folder,
    stdio: "inherit",
    env: { ...process.env, LIPAT_CHECK_NO_REACT: "1" },
  });
  writeFileSync(
    join(folder, "consumer.ts"),
    `import {createDeck} from '@byfungsi/lipat'; import type {LipatEngine,DeckInput} from '@byfungsi/lipat'; declare const engine:LipatEngine; const input:DeckInput={id:'d',slides:[{id:'s',content:{id:'n',type:'heading',text:'Hello'}}]}; const result=createDeck(input,{engine}); if(result.ok)result.value.apply([{type:'updateText',nodeId:'n',text:'Updated'}]);`,
  );
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
        skipLibCheck: false,
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
  const { build } = await import("esbuild");
  const result = await build({
    stdin: {
      contents:
        "import {getNodeText} from '@byfungsi/lipat/model'; console.log(getNodeText);",
      resolveDir: folder,
    },
    bundle: true,
    platform: "neutral",
    format: "esm",
    write: false,
    metafile: true,
  });
  if (
    Object.keys(result.metafile.inputs).some((p) =>
      /react|motion|wasm-engine|schemas.json/.test(p),
    )
  )
    throw new Error("Narrow model import pulled unrelated features");
  execFileSync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "react@19",
      "react-dom@19",
      "motion@^14.6.0",
    ],
    { cwd: folder, stdio: "pipe" },
  );
  writeFileSync(
    join(folder, "ssr.mjs"),
    `import React from 'react';import {renderToString} from 'react-dom/server';import {DeckPreview,DeckPlayer} from '@byfungsi/lipat/react';import {createMotionPlayback} from '@byfungsi/lipat/motion';import {runtime} from './consumer.mjs';if(!renderToString(React.createElement(DeckPreview,{deck:runtime})).includes('<svg'))throw new Error('Packed React SSR failed');if(!renderToString(React.createElement(DeckPlayer,{deck:runtime,playback:createMotionPlayback()})).includes('<svg'))throw new Error('Packed Motion SSR failed');console.log('Packed package: headless imports, declarations, optional React/Motion, bundling and SSR entry verified.');`,
  );
  execFileSync("node", ["ssr.mjs"], { cwd: folder, stdio: "inherit" });
} finally {
  rmSync(folder, { recursive: true, force: true });
}
