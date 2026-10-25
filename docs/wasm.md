# WebAssembly and native hosts

The parser, document validation, operation application and layout compiler run in Rust. The WASM module calls those exact crates; there is no alternate JavaScript parser or compiler to drift from native behavior.

## Browser / Vite

```ts
import wasmUrl from "@byfungsi/lipat/lipat.wasm?url";
import { createLipat } from "@byfungsi/lipat/wasm";
const response = await fetch(wasmUrl);
const engine = createLipat(new Uint8Array(await response.arrayBuffer()));
```

Load bytes once at your host boundary and keep the engine. Initialization and operations are synchronous; schedule large work in a Web Worker when appropriate. Synchronous compilation may be restricted by a host's CSP; configure WASM support or execute in an allowed worker. No global singleton or implicit request is created by Lipat.

## Node

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createLipat } from "@byfungsi/lipat/wasm";
const bytes = readFileSync(
  fileURLToPath(import.meta.resolve("@byfungsi/lipat/lipat.wasm")),
);
const initialized = createLipat(new Uint8Array(bytes));
```

Headless entrypoint declarations require ES2022, without DOM or Node ambient types. Hosts supply filesystem/network APIs outside the library. The WASM adapter itself requires the standard WebAssembly, TextEncoder and TextDecoder globals supported by the verified browser and Node hosts. React is optional.

## Precompiled modules and Cloudflare Workers

Available in **0.4.0**. Import the WASM asset through your Worker bundler and initialize the same SDK bridge from its precompiled module:

```ts
import lipatModule from "@byfungsi/lipat/lipat.wasm";
import { createLipatFromModule } from "@byfungsi/lipat/wasm";

const initialized = createLipatFromModule(lipatModule, {
  limits: {
    maxRequestBytes: 4 * 1024 * 1024,
    maxPptxBytes: 2 * 1024 * 1024,
    maxExpandedBytes: 8 * 1024 * 1024,
    maxEntryBytes: 2 * 1024 * 1024,
    maxXmlBytes: 1024 * 1024,
    maxXmlNodes: 20000,
    maxSlides: 100,
    maxNodes: 5000,
    maxSceneElements: 5000,
    maxAssetBytes: 2 * 1024 * 1024,
    maxTextBytes: 100000,
    maxTextLines: 1000,
    maxTableCells: 20000,
    maxLayoutWork: 2000000,
  },
});
```

`createLipatFromModule` is exported from the root and `/wasm`. It instantiates a host-supplied `WebAssembly.Module` and verifies the Lipat ABI. It never compiles bytes, fetches the module, copies the bridge into the host, or patches globals. The existing `createLipat(bytes, options?)` continues to compile bytes for Node/browser hosts, and accepts the same limit options. Initialization failures return `wasmUnavailable`; unsupported limit configurations return `invalidLimits`.

Cloudflare's [WASM API](https://developers.cloudflare.com/workers/runtime-apis/webassembly/javascript/) uses imported modules. `npm run verify:workerd` confirms that imported Lipat WASM validates, compiles, exports and reparses PPTX in real workerd while the byte-compilation path is denied. It also checks native host-limit errors, without Node compatibility flags or Cloudflare credentials. The pinned local binary is tested at compatibility date `2026-08-06`, its newest supported date; the package does not select a deployment compatibility date for your Worker.

The public module argument uses a structural `object` carrier so the SDK declarations remain usable without DOM ambient types. Supply a real precompiled Lipat module: arbitrary objects and incompatible modules fail ABI initialization. Packed-consumer checks include the current Cloudflare `WebAssembly.Module` type.

Configure [resource limits](./limits.md) for your workload. The example is an admission profile, not a guarantee of Worker CPU or memory consumption.

## Native Rust

Add path dependencies on the workspace crates. Parse source through serde and call `lipat_model::check_document` before using a rehydrated model. `lipat_author::apply_operations` validates its input/candidate; `lipat_layout::compile_document` validates before compiling; `lipat_pptx::parse_pptx` and `write_pptx` own their byte boundaries.

The CLI also accepts one JSON request on stdin:

```sh
echo '{"operation":"parseDocument","document":{"id":"demo","slides":[{"id":"s","content":{"id":"t","type":"heading","text":"Hello"}}]}}' | cargo run --quiet -p lipat-wasm --bin lipat-native
```

Operations in the JSON protocol are `parseDocument`, `apply`, `compile`, `parsePptx`, `writePptx` and `importPptx` (scene-to-document conversion). Requests may include a top-level `limits` object; `resourceLimits` returns the validated defaults merged with supplied limits. Byte payloads use base64. Results use the same tagged Result envelope as JavaScript.

## Build

`rustup target add wasm32-unknown-unknown`, then `npm run build:wasm`. Cargo.lock pins Rust dependencies; package-lock.json pins JavaScript tooling. The compiled binary is copied into the public npm package. Consumers do not need Rust. Direct WASM hosts can use exported `memory`, `lipat_alloc`, `lipat_execute` and `lipat_free`; the caller must follow the documented buffer ownership contract in the Rust source. `lipat_execute` returns an i64 containing output length in the high 32 bits and pointer in the low 32 bits. Every allocated input/output buffer must be freed exactly once.

Native/WASM parity is verified for validation, editing, font-metric layout, resource-budget failures and PPTX timing. Browser and Node tests exercise actual compiled WASM, not an emulated JavaScript path.
