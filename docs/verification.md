# Verification and contributing

`npm ci` installs locked JavaScript dependencies. `rustup target add wasm32-unknown-unknown` prepares the portable target. `npm run verify` checks boundaries, strict/headless types, tests, native crates, package/demo build, a packed consumer and documentation build.

Tests exercise real interfaces: TypeScript authoring through actual WASM, independent python-pptx import fixtures, parser/export roundtrips, atomic rollback and revision conflicts, property tests, React read-only/preview/playback behavior, native pipeline tests and native/WASM output equality. No parser or engine module mocks are used.

`npm run verify:browser` starts the production demo, exercises imports, edits, dragging, history, presentation/preview navigation and exports in Chromium, checks mobile overflow and saves screenshots to ignored `artifacts/`. Install Chromium with `npx playwright install chromium` if needed.

Motion playback checks include nonzero rendered bounds and an identity transform after each entrance and replay. Visibility and opacity alone cannot detect SVG content collapsed by a zero transform matrix.

For independent XML validation, install .NET SDK 8 and run `npm run verify:openxml`. This generates animations for text, rotated shapes, raster images and tables, automatic/parallel/delayed/gapped reveal groups, and linked image relationships. Microsoft’s Open XML SDK validates the actual PPTX package. Set `LIPAT_DOTNET` to a custom dotnet path if needed. CI runs this check.

For independent writer interoperability:

```sh
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements-interop.txt
LIPAT_PYTHON=.venv/bin/python npm run verify:interop
```

`scripts/create-interop-fixture.py` regenerates the committed fixture with python-pptx. The fixture is consumed by Lipat tests; a separate python-pptx consumer opens Lipat's exported PPTX and verifies content, notes, tables and images. Fixture generation is not required for normal tests.

`npm run schemas:generate` regenerates agent JSON schemas from native types. Schema changes should be committed with Rust/TypeScript contract changes. `npm run docs:build` generates agent-readable Markdown, llms indexes and a versioned documentation manifest before building VitePress.

## Package preparation

`npm run build` puts ESM, declarations and the compiled WASM asset in `packages/lipat/dist`. The public package is `@byfungsi/lipat`. The facade bundles all private TypeScript workspaces; no private packages need to be published. React and Motion are optional peers. Run `npm pack -w @byfungsi/lipat` to inspect a release locally. The GitHub Pages workflow verifies and deploys documentation from main using the /lipat/ base path. Release archives are prepared with `npm run release:prepare` and published explicitly as `@byfungsi/lipat`.

## Worker and artifact integration

`npm run verify:workerd` uses Miniflare's real workerd and a compiled-WASM module binding. It exercises public SDK initialization, document validation, layout, PPTX export/import, animation metadata and host-limit errors. Its control confirms dynamic byte compilation is denied without patching globals. This runs in the main verification command and CI.

Browser verification also builds a scene-only fixture, confirms it contains no WASM bridge, decodes embedded raster data, records zero external resource requests through preview/playback/navigation under the embedded-only policy, and checks explicit opt-in and scene replacement cleanup. Packed-consumer checks include scene-only SSR, browser bundle isolation and Cloudflare's published Worker types.
