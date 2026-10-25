# Verification and contributing

`npm ci` installs locked JavaScript dependencies. `rustup target add wasm32-unknown-unknown` prepares the portable target. `npm run verify` checks boundaries, strict/headless types, tests, native crates, package/demo build, a packed consumer and documentation build.

Tests exercise real interfaces: TypeScript authoring through actual WASM, independent python-pptx import fixtures, parser/export roundtrips, atomic rollback and revision conflicts, property tests, React read-only/preview/playback behavior, native pipeline tests and native/WASM output equality. No parser or engine module mocks are used.

`npm run verify:browser` starts the production demo, exercises imports, edits, dragging, history, presentation/preview navigation and exports in Chromium, checks mobile overflow and saves screenshots to ignored `artifacts/`. Install Chromium with `npx playwright install chromium` if needed.

For independent writer interoperability:

```sh
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements-interop.txt
LIPAT_PYTHON=.venv/bin/python npm run verify:interop
```

`scripts/create-interop-fixture.py` regenerates the committed fixture with python-pptx. The fixture is consumed by Lipat tests; a separate python-pptx consumer opens Lipat's exported PPTX and verifies content, notes, tables and images. Fixture generation is not required for normal tests.

`npm run schemas:generate` regenerates agent JSON schemas from native types. Schema changes should be committed with Rust/TypeScript contract changes. `npm run docs:build` generates agent-readable Markdown, llms indexes and a versioned documentation manifest before building VitePress.

## Package preparation

`npm run build` puts ESM, declarations and the compiled WASM asset in `packages/lipat/dist`. The public package is `@byfungsi/lipat`. The facade bundles all private TypeScript workspaces; no private packages need to be published. React is an optional peer. Run `npm pack -w @byfungsi/lipat` to inspect a release locally. The GitHub Pages workflow verifies and deploys documentation from main using the /lipat/ base path. Release archives are prepared with `npm run release:prepare` and published explicitly as `@byfungsi/lipat`.
