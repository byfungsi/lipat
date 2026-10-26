# Charts, SVG and presentation templates

Requested scope: editable charts, SVG support and 60 beautiful ready-to-use presentation templates spanning different use cases and domains, grouped by audience, plus a slide editor with visual navigation and a fitted workspace. The user requested online design research. Do not reduce this to themes or individual slide presets. The original 30-template delivery and its verification are recorded below; the latest expansion adds 30 complete decks.

Design research and 30 original six-slide briefs: [presentation-template-design.md](../research/presentation-template-design.md).

## Architecture

- Chart data belongs to the Rust/TypeScript shared model. Six category chart kinds: column, bar, line, area, pie and doughnut. Column/bar/area support stacking. Data remains editable through `setChartData`, scene lifting, previews and native DrawingML charts with embedded XLSX.
- SVG uses image assets (`image/svg+xml`) and the existing image-source/host-loading pipeline. Static vector XML admits shapes, paths, gradients, clipping, masks and text. Scripts, events, external references, CSS sheets, images, use and animation are rejected. Scene-only renderers reparse and scope SVG IDs. PPTX contains both the SVG extension and a deterministic resvg PNG fallback with bundled OFL Lato font, no host font discovery.
- Templates belong to an optional `/templates` entrypoint. Instantiation returns ordinary editable deck input, no WASM initialization or network. Embedded original illustrative photography plus native text/shapes/charts make decks complete offline. Follow the research's 30 stable IDs and narrative-specific six-slide sequences.

## Verification and remaining work

- [x] Chart model, authoring operation, layout, SVG rendering, native PPTX writer/reader, generated schemas.
- [x] SVG admission, renderer policy, image pipeline, PPTX vector/fallback writer/reader.
- [x] Web/native chart property controls (run UI tests and final review).
- [x] First independent checks: six kinds had zero Open XML validation errors; python-pptx read series, embedded workbook cells and SVG PNG fallbacks.
- [x] Chart/SVG error, independent input, resource and editor tests; formatting/clippy; support limits and bundled fallback font license documented.
- [x] 30 distinct full templates (180 slides), stable catalog and instantiation API.
- [x] Playground gallery plus end-to-end chart/SVG sample; documentation and packed package entrypoint checks.
- [x] All templates compiled/exported/reparsed without measured overflow diagnostics; all 180 slides reviewed in browser contact sheets, representative full-size slides and editing flows checked.
- [x] Full native/WASM/workerd, packed-consumer and browser verification, independent exports; no device tests per user instruction.

## Verified outcome

`npm run verify` passed with 144 JavaScript tests plus Rust, packed-consumer, workerd and host native ABI checks. `cargo clippy --workspace --all-targets -- -D warnings` and formatting passed. All four `verify:browser` flows passed, including chart spreadsheet edits exported and reparsed from native PPTX. `verify:templates` validated all 30 template decks and six chart fixtures with zero Open XML errors; independent python-pptx checked 180 slides, chart categories/values, embedded workbook cells and nonempty SVG PNG fallbacks.

The reported Layers clipping was reproduced at 16px row height versus 31.95px required for the line and padding. Default flex shrinking compressed the rows inside the 180px scrolling panel. Disabling row shrink preserves readable rows and scrolling. The browser regression covers crowded template layers at desktop and narrow widths, bottom-row selection and keyboard selection. Changed SVG artwork and differently sized doughnut charts also keep paint/mask references isolated across scene previews.

Publication was not requested for this new scope. Leave release versions unchanged unless the user requests a release.

## Editorial redesign iteration

The first visual review was too generic: repeated symbolic artwork, equal-weight cards and weak headline contrast. The [redesign critique and primary-source research](../research/presentation-template-redesign.md) informed six photographic cover families, shorter display headlines, open interior columns, quieter charts and two closing compositions. All 30 six-slide decks were recomposed. Fifteen original AI-generated illustrative photographs are embedded in the optional templates entrypoint; architecture, hospitality and culinary decks include complementary detail imagery. Asset provenance and prompts live in `packages/templates/assets/README.md`.

The redesign retains editable text, charts and picture frames, offline rendering, stable template IDs, and the Layers scrolling fix. The first image pass was reviewed across all domains; repeated lifestyle photos and crowded caption spacing were revised after that review. Final visual captures are in `artifacts/template-redesign/`.

Redesign checks: 32 template tests passed, including all 180 slides without measured overflow and PPTX round trips; TypeScript and package boundaries passed; demo/SDK builds passed; template browser editing/export flow passed at desktop and narrow widths; all 36 PPTX fixtures have zero Open XML errors; independent python-pptx verified embedded JPEGs, chart values, workbook cells and offline relationships; the packed SDK consumer passed. No device tests were run.

## Audience expansion and editor workspace

The catalog now has 60 complete six-slide decks (360 slides). Thirty new narratives cover student projects, humanities seminars, lab reports, capstones, scholarships, research proposals, methods, conference papers, replication, technical talks, demos, workshops, positioning and marketing campaigns. They reuse the embedded original photography and editable slide components. Stable category metadata is exported through `/templates`; gallery category filters combine with text search.

The six groups are Students & learning (11), Research (11), Tech talks (10), Marketing & creative (11), Business (7), and Industry & impact (10). All previous template IDs remain available.

The built-in editor now uses live slide thumbnails on the left, a compact toolbar, a canvas fitted to the available workspace, contextual controls on the right, and speaker notes below. Insert and slide settings have dedicated panels. Keyboard slide navigation and drag reordering remain available; text changes update the thumbnails. The composable `SlideTabs` keeps its default text mode, with an optional `thumbnails` prop.

Verification: 175 JavaScript tests passed, including all 60 template round trips and editor navigation/notes/live-thumbnail coverage. All four browser suites passed, including category/search filtering, fitted-canvas bounds, crowded layers at desktop and narrow widths, chart edits, image insertion, undo, animation preview and PPTX export. All 66 PPTX fixtures have zero Open XML validation errors; independent python-pptx checks cover 360 template slides, embedded JPEGs, native charts and workbook cells. The 180 new slides were visually reviewed in six contact sheets. TypeScript, package boundaries, SDK/demo builds, packed-consumer checks and the documentation build passed. Captures are in `artifacts/editor-60/`. No device tests were run.
