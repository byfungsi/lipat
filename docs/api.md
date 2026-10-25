# API

All expected failures are `LipatResult<T>` with a stable `error.reason` and a readable `message`. Do not classify errors by message text.

## Engine

`createLipat(wasmBytes)` creates a synchronous engine instance from an explicitly supplied `Uint8Array`. `engine.parseDocument(unknown)` validates/copies/freezes source; `compile(document, options)` returns `{scene, diagnostics}`; `applyDocument(document, operations)` returns a new validated document. `parsePptx(bytes)`, `writePptx(scene)` and `importScene(scene)` are independent capabilities.

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

Operations: `updateText`, `updateStyle`, `setFrame`, `setLayout`, `replaceNode`, `insertNode`, `deleteNode`, `moveNode`, `insertSlide`, `deleteSlide`, `moveSlide`, `updateSlide`, `setTheme`, `upsertAsset`, `deleteAsset`. The generated schema in `/agent` describes every field.

`updateStyle` merges supplied properties; false clears bold/italic/underline. `replaceNode` replaces the complete node but must retain its ID. `setFrame` accepts null to restore flow placement. Removing the last slide, duplicate IDs, missing assets and nonrectangular tables are rejected. Final-state validation permits an atomic batch to add an asset and then use it.

Node moves use the insertion index after removing the original node. A node cannot move into itself or a descendant. Slide roots cannot be deleted through node operations. Slide-level operations handle slide lifecycle.

## Render

`renderSlideSvg(scene, slideId, {title?,step?})` returns escaped SVG. `step` filters incremental content for playback; omitted means all content. `renderDeckHtml(scene)` returns self-contained HTML with keyboard navigation, steps, notes and print styles. Input is expected to be a validated scene from the engine.

`renderRevealMarkup(scene)` emits reveal-compatible sections and fragments. `updateRevealPresentation(root,reveal,scene)` replaces markup and calls the injected instance's `sync()`. Hosts load reveal.js, its styles and plugins themselves.
