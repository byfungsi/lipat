# Charts, SVG and presentation templates

Requested scope: editable charts, SVG support and 30 beautiful ready-to-use presentation templates spanning different use cases and domains. The user requested online design research. Do not reduce this to themes or individual slide presets.

Design research and 30 original six-slide briefs: [presentation-template-design.md](../research/presentation-template-design.md).

## Architecture

- Chart data belongs to the Rust/TypeScript shared model. Six category chart kinds: column, bar, line, area, pie and doughnut. Column/bar/area support stacking. Data remains editable through `setChartData`, scene lifting, previews and native DrawingML charts with embedded XLSX.
- SVG uses image assets (`image/svg+xml`) and the existing image-source/host-loading pipeline. Static vector XML admits shapes, paths, gradients, clipping, masks and text. Scripts, events, external references, CSS sheets, images, use and animation are rejected. Scene-only renderers reparse and scope SVG IDs. PPTX contains both the SVG extension and a deterministic resvg PNG fallback with bundled OFL Lato font, no host font discovery.
- Templates belong to an optional `/templates` entrypoint. Instantiation returns ordinary editable deck input, no WASM initialization or network. Original vector motifs plus native text/shapes/charts make decks complete offline. Follow the research's 30 stable IDs and narrative-specific six-slide sequences.

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
