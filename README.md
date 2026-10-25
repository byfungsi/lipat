# Lipat

An agent-friendly slide authoring engine with an independent PPTX parser and exporter. Create slides from semantic JSON, TypeScript presets or Markdown; edit by stable IDs; compile into a shared scene for preview and export. The portable Rust core runs natively and as real WebAssembly in browsers, Node and Workers with imported precompiled modules.

Inspired by [Nori](https://github.com/byfungsi/nori)'s headless model/runtime/adapters and [reveal.js](https://github.com/hakimel/reveal.js)'s declarative presentation flow. Lipat's primary source is an abstract authoring document. PPTX is a separate file adapter.

## Install

```sh
npm install @byfungsi/lipat
# Add React only when using @byfungsi/lipat/react:
npm install react react-dom
```

[Documentation](https://byfungsi.github.io/lipat/) · [Playground](https://byfungsi.github.io/lipat/playground.html) · [GitHub](https://github.com/byfungsi/lipat) · [npm](https://www.npmjs.com/package/@byfungsi/lipat)

## Run locally

Requires Node 22.12+, npm, stable Rust and the WASM target:

```sh
rustup target add wasm32-unknown-unknown
npm ci
npm run verify
npm run dev
```

`npm run dev` builds the package and prints the Vite URL. The demo includes semantic editing, drag/resize and keyboard nudges, history, source JSON, Markdown/PPTX upload, presentation playback, an agent edit and a read-only attachment preview. The library ships no global CSS. Choose **Animation sample** to try fade, rise, slide and zoom, or [open it directly](https://byfungsi.github.io/lipat/playground/index.html?sample=animations). Native PPTX export retains these effects. The [image sample](https://byfungsi.github.io/lipat/playground/index.html?sample=images) supports direct image URLs and embeds them in downloads.

## Create and edit

The host loads the bundled WASM bytes explicitly. Importing the library performs no file access, network access or engine initialization.

```ts
import {
  createLipat,
  createDeck,
  createTitleSlide,
  createComparisonSlide,
} from "@byfungsi/lipat";

// Browser: fetch a URL emitted by your bundler for @byfungsi/lipat/lipat.wasm.
// Node: readFileSync(import.meta.resolve('@byfungsi/lipat/lipat.wasm')) via fileURLToPath.
const initialized = createLipat(wasmBytes);
if (!initialized.ok) throw new Error(initialized.error.message);
const engine = initialized.value;

const created = createDeck(
  {
    id: "launch",
    title: "A better workflow",
    slides: [
      createTitleSlide({
        id: "intro",
        title: "Make room for better ideas",
        subtitle: "An introduction to Lipat",
      }),
      createComparisonSlide({
        id: "compare",
        title: "What changes?",
        columns: [
          { title: "Today", body: "Position every element manually." },
          { title: "Tomorrow", body: "Describe content and layout intent." },
        ],
      }),
    ],
  },
  { engine },
);
if (!created.ok) throw new Error(created.error.message);
const deck = created.value;

const result = deck.apply(
  [
    {
      type: "updateText",
      nodeId: "intro-title",
      text: "Fold your next idea into a story",
    },
  ],
  { expectedRevision: deck.getState().revision },
);
if (!result.ok) console.error(result.error);
const compiled = deck.compile(); // { scene, diagnostics } inside a Result
```

Expected failures use `{ ok: true, value } | { ok: false, error }`. Handle results at your application boundary. Examples throw only to terminate their setup when they cannot proceed.

## Independent PPTX flow

```ts
import { parsePptx, writePptx } from "@byfungsi/lipat/pptx";

const imported = parsePptx(bytes, { engine });
if (imported.ok) {
  // Preview or export the imported scene without creating an authoring runtime.
  console.log(imported.value.scene, imported.value.diagnostics);
  const exported = writePptx(imported.value.scene, { engine });
  // Explicit conversion retains imported positioning as editable canvas nodes.
  const document = engine.importScene(imported.value.scene);
}
```

Parsing does not infer that positioned objects form a semantic comparison, title or grid. Agents can explicitly replace imported canvas content with higher-level layouts. Export produces a canonical PPTX; arbitrary original XML parts are not preserved.

## Agent loop

```ts
import { createAgentTools, deckSchemas } from "@byfungsi/lipat/agent";
const agentTools = createAgentTools(deck, { engine });
// Register agentTools.tools with your preferred framework.
// Route calls to agentTools.execute(name, arguments).
```

Five provider-neutral tools implement inspect → edit → compile → preview → export. Edit calls require an expected revision and return compact updated outlines. Tool and document schemas are generated from the same Rust types used to execute operations. No LLM provider, API key, server or MCP transport is required. See [agent authoring](docs/agents.md).

## Public entrypoints

| Import            | Responsibility                                                         |
| ----------------- | ---------------------------------------------------------------------- |
| `@byfungsi/lipat` | WASM initialization, creation, presets, common types and PPTX helpers  |
| `/model`          | Portable document, scene, operation and diagnostic contracts           |
| `/core`           | Runtime, history, subscriptions, presets and Markdown authoring        |
| `/images`         | Host-controlled URL image loading and immutable offline embedding      |
| `/pptx`           | Independent PPTX byte adapter                                          |
| `/wasm`           | Explicit Rust engine initialization                                    |
| `/render`         | Headless SVG and self-contained HTML output                            |
| `/motion`         | Optional Motion browser playback adapter (install `motion` separately) |
| `/react`          | Provider, hooks, canvas, inspector, editor, preview and player         |
| `/agent`          | Tool definitions, execution and generated JSON schemas                 |
| `/reveal`         | Optional reveal.js-compatible markup and synchronization               |
| `/lipat.wasm`     | Bundled binary asset, emitted/copied by the host's bundler             |

ESM and TypeScript declarations are supplied. React 18.3/19 and Motion 14.6+ are optional peers isolated to `/react` and `/motion`. The npm package has no runtime JavaScript dependencies. Source releases and documentation are published from the byfungsi/lipat repository.

## Architecture and compatibility

Read [architecture](docs/architecture.md), [creation](docs/creation.md), [API](docs/api.md), [WASM and native usage](docs/wasm.md), [support and Nori parity](docs/support.md), [React](docs/react.md), [import/export](docs/pptx.md), and [verification](docs/verification.md).

Flow layout uses deterministic font metrics. Defaults are approximate and reported as diagnostics; supply measured glyph widths for accurate wrapping. Browser font rasterization can differ from the compiler. Supported PPTX content includes ordinary text/runs, basic shapes, raster images, simple tables, notes, slide ordering and inherited placeholder geometry. Portable entrance effects and reveal steps map to both the optional [Motion browser adapter and native PPTX timing](docs/animations.md), with easing approximations reported. [Direct image URLs](docs/images.md) can be previewed, linked, or embedded for offline delivery. Charts, SmartArt, media, arbitrary timelines and lossless PPTX rewriting are outside this version. Import/export warnings make these boundaries visible.

## Native Rust

```rust
let document: lipat_model::DeckDocument = serde_json::from_str(source)?;
let compiled = lipat_layout::compile_document(&document, &Default::default());
let imported = lipat_pptx::parse_pptx(&bytes);
```

Workspace crates are path dependencies until published. `cargo run -p lipat-wasm --bin lipat-native` exposes the same JSON request protocol as WASM on stdin/stdout. See [native usage](docs/wasm.md).

## Verification

`npm run verify` checks dependency boundaries, strict/headless TypeScript, behavioral/property/React tests through the real WASM engine, native Rust tests, native/WASM equivalence, builds, an isolated packed npm consumer, optional React/SSR isolation and documentation generation/build.

`npm run verify:browser` exercises the built demo in a real Chromium browser. `npm run verify:interop` independently opens exported PPTX with python-pptx after installing `scripts/requirements-interop.txt`. `npm run verify:openxml` validates animated and linked-image packages with Microsoft’s Open XML SDK (.NET 8 required). CI runs these extra checks too.

## Worker and immutable Artifact hosts

Version **0.4.0** adds `createLipatFromModule(module, {limits})` for precompiled Worker WASM while preserving `createLipat(bytes, {limits})`. Both share one ABI bridge and native resource budgets. See [Worker setup](docs/wasm.md) and [limit enforcement](docs/limits.md).

`ScenePreview` and `ScenePlayer` from `/react` accept a `SlideScene` directly, with no authoring runtime or WASM initialization. They default to `imagePolicy="embedded-only"`. Existing runtime viewers accept the same policy. [Scene viewer guide](docs/react.md) · [Live sample](https://byfungsi.github.io/lipat/playground/scene.html).

`npm run verify:workerd` tests the real restricted runtime; browser checks verify scene-only rendering without external fetches. Resource budgets bound admitted processing, not elapsed time or total heap usage; synchronous WASM cannot be interrupted by a JavaScript timer on the same thread.

## Built-in editing and React Native

The reusable `DeckEditor` adds content, slides, layers, rich properties, drag and drop, image workflows and animation controls. Supply `onSave` to persist the immutable document in your application, and `resolveImage` to upload/process images before inserting the final URL or embedded asset. Import the optional `@byfungsi/lipat/editor.css` skin. See [the editor guide](docs/editor.md).

`@byfungsi/lipat/react-native` provides native preview/player/editor views. The optional `@byfungsi/lipat-native` add-on connects Expo/React Native development builds to the same Rust engine without requiring browser WASM in Hermes. Scene-only views need no engine. See [React Native setup](docs/react-native.md) and `examples/native-demo`.

## Layout and Markdown diagnostics

Version **0.6.0** adds structured overflow bounds and suggested remedies to native/WASM compilation. Use `importMarkdown(source, {id, engine})` for the validated working document, resolved scene, detected slide count/source boundaries and a warning when a single slide overflows. `fromMarkdown` keeps its existing contract and slide-separator grammar. Retain compiler diagnostics before exporting; see [the diagnostics and host integration guide](docs/diagnostics.md).
