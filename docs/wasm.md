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

## Native Rust

Add path dependencies on the workspace crates. Parse source through serde and call `lipat_model::check_document` before using a rehydrated model. `lipat_author::apply_operations` validates its input/candidate; `lipat_layout::compile_document` validates before compiling; `lipat_pptx::parse_pptx` and `write_pptx` own their byte boundaries.

The CLI also accepts one JSON request on stdin:

```sh
echo '{"operation":"parseDocument","document":{"id":"demo","slides":[{"id":"s","content":{"id":"t","type":"heading","text":"Hello"}}]}}' | cargo run --quiet -p lipat-wasm --bin lipat-native
```

Operations in the JSON protocol are `parseDocument`, `apply`, `compile`, `parsePptx`, `writePptx` and `importPptx` (scene-to-document conversion). Byte payloads use base64. Results use the same tagged Result envelope as JavaScript.

## Build

`rustup target add wasm32-unknown-unknown`, then `npm run build:wasm`. Cargo.lock pins Rust dependencies; package-lock.json pins JavaScript tooling. The compiled binary is copied into the public npm package. Consumers do not need Rust. Direct WASM hosts can use exported `memory`, `lipat_alloc`, `lipat_execute` and `lipat_free`; the caller must follow the documented buffer ownership contract in the Rust source. `lipat_execute` returns an i64 containing output length in the high 32 bits and pointer in the low 32 bits. Every allocated input/output buffer must be freed exactly once.

Native/WASM parity is verified for validation, editing and font-metric layout. Browser and Node tests exercise actual compiled WASM, not an emulated JavaScript path.
