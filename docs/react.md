# React

React 18.3 and 19 are supported optional peers. The root package never imports React. `/react` supplies composable pieces without global CSS.

```tsx
import {
  DeckProvider,
  SlideTabs,
  HistoryToolbar,
  SlideCanvas,
  NodeInspector,
  LayoutDiagnostics,
} from "@byfungsi/lipat/react";

<DeckProvider deck={deck}>
  <HistoryToolbar />
  <SlideTabs />
  <SlideCanvas onError={reportError} />
  <NodeInspector onError={reportError} />
  <LayoutDiagnostics />
</DeckProvider>;
```

`DeckEditor` composes these pieces. `useDeck`, `useDeckState`, `useDeckScene` and `useDeckReadOnly` support custom interfaces. The provider does not own/dispose the runtime. Subscriptions clean up on unmount; the host disposes the runtime when it is no longer needed.

The canvas supports pointer selection, Shift additive selection, drag movement, a resize handle and arrow-key nudges (Shift moves 10 points). A drag/resize commits one history step; Escape cancels an active gesture. The inspector edits content, rich text runs, formatting, tables, image/shape options, layout, frames, rotation and portable animation settings.

For the built-in editor, import its optional skin and supply host persistence:

```tsx
import { DeckEditor } from "@byfungsi/lipat/react";
import "@byfungsi/lipat/editor.css";

<DeckEditor
  deck={deck}
  onSave={savePresentation}
  resolveImage={prepareImage}
/>;
```

This includes slide/content creation, palette and file drops, image URLs, layers, undo/redo, notes/themes, Save status and animation preview/replay. The default animation driver uses browser Web Animations; Motion remains an optional override. Save and image processing belong to the host: see the [editor guide](./editor.md) for asynchronous uploads/commands and cancellation.

Use `readOnly` on the provider or convenience editor for navigable read-only content. UI controls obey this mode; the runtime remains an application capability, so read-only rendering is not an authorization boundary.

`DeckPreview` is a separate attachment card with local slide navigation and optional `title`, `theme` and `onOpen`. It never updates the full editor's active slide or selection. `DeckPlayer` uses local playback state, hides hidden slides, handles incremental steps and exposes notes. Theme props add data attributes; hosts supply application styling.

Style `.lipat-editor`, `.lipat-tabs`, `.lipat-canvas`, `.lipat-inspector`, `.lipat-diagnostics`, `.lipat-preview`, `.lipat-player` and `[data-selected]`. Document formatting is rendered separately from application chrome. Use the demo stylesheet as an example.

For optional entrance effects, pass `playback={createMotionPlayback()}` to `DeckPlayer` using a stable adapter instance. See [animations](./animations.md) for Motion setup, agent operations and output boundaries.

## Immutable scene-only viewers

Available in **0.4.0**. Render a validated `SlideScene` directly, without constructing a `DeckRuntime`, fetching WASM or recompiling layout:

```tsx
import { ScenePreview, ScenePlayer } from "@byfungsi/lipat/react";

<ScenePreview scene={artifact.scene} title="presentation.pptx" />;
<ScenePlayer scene={artifact.scene} />;
```

Both default to `imagePolicy="embedded-only"`. Remote image nodes are omitted, embedded images are restricted to raster data, and SVG paint attributes cannot introduce URL resources. The renderer emits no external resource references under this policy. It does not control unrelated host CSS, plugins or application network access. The host must validate untrusted serialized artifacts before treating them as `SlideScene` values.

`ScenePreview` also accepts `title`, `theme` and `onOpen`. Its local navigation includes hidden slides, as an attachment preview does. `ScenePlayer` skips hidden slides, supports reveal steps, keyboard navigation and notes, and accepts the same optional `playback={createMotionPlayback()}` adapter. Immutable scene replacement resets navigation/reveals before paint and releases previous playback controllers. Empty scenes and scenes containing only hidden slides have explicit empty states.

Use `imagePolicy="allow-external"` only when the host permits image URL loading. Existing `DeckPreview` and `DeckPlayer` remain runtime-based wrappers and retain their external-image default for compatibility; they accept `imagePolicy="embedded-only"` to opt into the same restriction. Neither viewer edits source data.

[Open the scene-only sample](./playground/scene.html). It imports no WASM bridge and embeds its raster image in the scene. Its styling uses local resources.
