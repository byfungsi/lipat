# API

All expected failures are `LipatResult<T>` with a stable `error.reason` and a readable `message`. Do not classify errors by message text.

## Engine

`createLipat(wasmBytes, options?)` and `createLipatFromModule(module, options?)` create synchronous engine instances from explicitly supplied bytes or a precompiled `WebAssembly.Module`, respectively. `engine.parseDocument(unknown)` validates/copies/freezes source; `compile(document, options)` returns `{scene, diagnostics}`; `applyDocument(document, operations)` returns a new validated document. `parsePptx(bytes)`, `writePptx(scene)` and `importScene(scene)` are independent capabilities.

## Runtime

`createDeck(input, {engine, historyLimit?})` returns a `DeckRuntime`.

| Method                                     | Contract                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `getState()`                               | Stable immutable document, revision, active slide, selection and undo/redo flags |
| `exportDocument()`                         | Canonical JSON source; no runtime services or transient state                    |
| `inspect({slideId?,maxTextLength?})`       | Compact outline with stable node IDs and parent identities                       |
| `apply(operations,{expectedRevision?})`    | Atomic edit; conflict and invalid batches have no partial effects                |
| `compile(options?)`                        | Resolve source without changing state/history                                    |
| `setActiveSlide(id)` / `setSelection(ids)` | Validated transient navigation                                                   |
| `undo()` / `redo()`                        | One transaction at a time; document revision advances                            |
| `subscribe(listener)`                      | Returns unsubscribe; callback defects propagate to the host                      |
| `dispose()`                                | Release listeners/history and reject subsequent mutations                        |

Operations: `updateText`, `updateStyle`, `setFrame`, `setLayout`, `setAnimation`, `setStep`, `setImageSource`, `replaceNode`, `insertNode`, `deleteNode`, `moveNode`, `insertSlide`, `deleteSlide`, `moveSlide`, `updateSlide`, `updateDocument`, `setTheme`, `upsertAsset`, `deleteAsset`. The generated schema in `/agent` describes every field.

`updateStyle` merges supplied properties; false clears bold/italic/underline. `replaceNode` replaces the complete node but must retain its ID. `setFrame` accepts null to restore flow placement. Removing the last slide, duplicate IDs, missing assets and nonrectangular tables are rejected. Final-state validation permits an atomic batch to add an asset and then use it.

Node moves use the insertion index after removing the original node. A node cannot move into itself or a descendant. Slide roots cannot be deleted through node operations. Slide-level operations handle slide lifecycle.

## Render

`renderSlideSvg(scene, slideId, {title?,step?,retainSteps?})` returns escaped SVG. `step` filters incremental content for playback; omitted means all content. `retainSteps` retains future content in hidden SVG groups for playback adapters. `renderDeckHtml(scene)` returns HTML (self-contained when image assets are embedded) with keyboard navigation, steps, notes and print styles. Input is expected to be a validated scene from the engine.

`renderRevealMarkup(scene)` emits reveal-compatible sections and fragments. `updateRevealPresentation(root,reveal,scene)` replaces markup and calls the injected instance's `sync()`. Hosts load reveal.js, its styles and plugins themselves.

## Image resolution

`/images` exports `createImageLoader`, `embedDocumentImages` and `embedSceneImages`. `/pptx` and the root entry export `writePptxWithImages`. Hosts supply the network capability; failures return Result values. See [image URLs](./images.md) for embedding, linked export and limits.

## Scene viewers and resource policy

`/react` exports `ScenePreview` and `ScenePlayer`, accepting `SlideScene` without an authoring runtime. They default to embedded raster and static SVG images only; existing runtime wrappers accept the same `imagePolicy` prop. `renderSlideSvg`, `renderDeckHtml`, `renderRevealMarkup` and `updateRevealPresentation` accept `imagePolicy` options for headless hosts. See [React](./react.md).

`ResourceLimits` and `LipatOptions` are exported from the root/model. Both engine factories apply validated, immutable host budgets. See [resource limits](./limits.md) for fields, enforcement stages and host responsibilities.

`DeckDiagnostic.bounds` provides measured/available rectangles and per-edge overflow for `textOverflow`, `layoutOverflow` and `outsideSlide`. `recommendations` carries stable remedy codes. `importMarkdown` at root/core adds `MarkdownImportOutput` with canonical `document`, `scene`, `diagnostics` and a `MarkdownImportSummary` containing slide count and parser-derived line boundaries. `fromMarkdown` retains its existing `DeckInput` result. See [layout and Markdown diagnostics](./diagnostics.md).

## Built-in editor and native hosts

`/core` exports `createDeckEditorSession(deck, options)`. The session owns save/image task state, dirty snapshots and atomic editing commands while the host owns the runtime. `onSave(document, context)` persists an immutable snapshot; `resolveImage(input, context)` may perform any asynchronous host work before returning a final URL or embedded asset. See [editor contracts](./editor.md).

`DeckRuntime.applyToCanvas(slideId, operations, options?)` resolves a semantic slide to canvas frames and applies the requested freeform edit in one undoable transaction. Primitive IDs and appearance are retained. `updateDocument` changes title and/or slide size; changing size does not automatically scale explicit geometry.

`/react` exports `DeckEditor` and `createBrowserPlayback`. Optional `editor.css` styles the editor without global JavaScript import effects. `/react-native` exports `NativeDeckEditor`, `NativeScenePreview`, `NativeScenePlayer` and `NativeSceneSlide`. `/native` exports `createLipatFromNative(bridge, options?)`; the optional `@byfungsi/lipat-native` Expo add-on supplies `createNativeLipat(options?)` backed by Rust, with no WebAssembly requirement. See [native setup](./react-native.md).

## Charts and templates (unreleased)

Chart nodes and scene elements use `type: "chart"` with `ChartData`. `setChartData` replaces a chart's portable data atomically. `maxChartPoints` bounds cumulative category × series values. `/core` exports `formatChartTable` and `parseChartTable` for spreadsheet-paste editing. See [charts](./charts.md).

`/images` exports `createSvgAsset({id, svg})`; this UTF-8/base64 helper leaves static-profile admission to the engine. See [SVG assets](./images.md#svg-image-assets).

`/templates` exports `presentationTemplates`, `createPresentationTemplate(templateId, options?)`, `PresentationTemplateInfo` and `PresentationTemplateOptions`. The factory returns `LipatResult<DeckInput>` without initializing an engine. See [30 presentation templates](./templates.md).
