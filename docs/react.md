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

The canvas supports pointer selection, Shift additive selection, drag movement, a resize handle and arrow-key nudges (Shift moves 10 points). A drag/resize commits one history step; Escape cancels an active gesture. The inspector edits text and speaker notes. Text replacement produces plain text; use operations with rich runs to retain explicit per-run formatting.

Use `readOnly` on the provider or convenience editor for navigable read-only content. UI controls obey this mode; the runtime remains an application capability, so read-only rendering is not an authorization boundary.

`DeckPreview` is a separate attachment card with local slide navigation and optional `title`, `theme` and `onOpen`. It never updates the full editor's active slide or selection. `DeckPlayer` uses local playback state, hides hidden slides, handles incremental steps and exposes notes. Theme props add data attributes; hosts supply application styling.

Style `.lipat-editor`, `.lipat-tabs`, `.lipat-canvas`, `.lipat-inspector`, `.lipat-diagnostics`, `.lipat-preview`, `.lipat-player` and `[data-selected]`. Document formatting is rendered separately from application chrome. Use the demo stylesheet as an example.
