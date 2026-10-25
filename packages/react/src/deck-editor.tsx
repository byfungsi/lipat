import { useState } from "react";
import type { ReactNode } from "react";
import type { DeckRuntime } from "@lipat-internal/core";
import type { LipatError, SlideNode } from "@lipat-internal/model";
import { getNodeText } from "@lipat-internal/model";
import {
  DeckProvider,
  useDeck,
  useDeckReadOnly,
  useDeckScene,
  useDeckState,
} from "./deck-context";
import { SlideCanvas } from "./slide-canvas";
function nodeById(n: SlideNode, id: string): SlideNode | undefined {
  if (n.id === id) return n;
  if ("children" in n)
    for (const c of n.children) {
      const result = nodeById(c, id);
      if (result) return result;
    }
  return undefined;
}
/** Composable slide navigation follows deck order, including hidden slides while editing. */
export function SlideTabs({
  className,
}: {
  readonly className?: string;
}): ReactNode {
  const deck = useDeck(),
    state = useDeckState();
  return (
    <nav className={className ?? "lipat-tabs"} aria-label="Slides">
      {state.document.slides.map((slide, i) => (
        <button
          key={slide.id}
          type="button"
          aria-current={slide.id === state.activeSlideId ? "page" : undefined}
          onClick={() => deck.setActiveSlide(slide.id)}
        >
          {i + 1}. {slide.title || slide.id}
          {slide.hidden ? " (hidden)" : ""}
        </button>
      ))}
    </nav>
  );
}
/** History controls obey the provider's read-only mode. */
export function HistoryToolbar(): ReactNode {
  const deck = useDeck(),
    state = useDeckState(),
    readOnly = useDeckReadOnly();
  return (
    <div className="lipat-history">
      <button disabled={readOnly || !state.canUndo} onClick={() => deck.undo()}>
        Undo
      </button>
      <button disabled={readOnly || !state.canRedo} onClick={() => deck.redo()}>
        Redo
      </button>
    </div>
  );
}
function TextEditor({
  node,
  onError,
}: {
  node: SlideNode;
  onError?: (error: LipatError) => void;
}): ReactNode {
  const deck = useDeck();
  const [text, setText] = useState(getNodeText(node));
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const result = deck.apply([
          { type: "updateText", nodeId: node.id, text },
        ]);
        if (!result.ok) onError?.(result.error);
      }}
    >
      <label>
        Text
        <textarea
          aria-label="Selected text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <button type="submit">Apply text</button>
    </form>
  );
}
/** Inspector edits semantic text and speaker notes using ordinary runtime operations. */
export function NodeInspector({
  onError,
}: {
  readonly onError?: (error: LipatError) => void;
}): ReactNode {
  const deck = useDeck(),
    state = useDeckState(),
    readOnly = useDeckReadOnly();
  const slide = state.document.slides.find((s) => s.id === state.activeSlideId);
  const selected = state.selection[0];
  const node =
    selected && slide ? nodeById(slide.content, selected) : undefined;
  return (
    <aside className="lipat-inspector">
      {node ? (
        <>
          <p>
            {node.id} · {node.type}
          </p>
          {!readOnly && "text" in node ? (
            <TextEditor
              key={`${node.id}-${state.revision}`}
              node={node}
              {...(onError ? { onError } : {})}
            />
          ) : (
            <p>{getNodeText(node)}</p>
          )}
        </>
      ) : (
        <p>Select an element to edit it.</p>
      )}
      {slide ? (
        <label>
          Speaker notes
          <textarea
            aria-label="Speaker notes"
            readOnly={readOnly}
            value={slide.notes ?? ""}
            onChange={(e) => {
              const r = deck.apply([
                {
                  type: "updateSlide",
                  slideId: slide.id,
                  notes: e.target.value,
                },
              ]);
              if (!r.ok) onError?.(r.error);
            }}
          />
        </label>
      ) : null}
    </aside>
  );
}
/** Diagnostics stay available to both human editors and agent tools. */
export function LayoutDiagnostics(): ReactNode {
  const compiled = useDeckScene();
  return (
    <ul className="lipat-diagnostics" aria-label="Layout diagnostics">
      {compiled.ok ? (
        compiled.value.diagnostics.map((d, i) => (
          <li key={i} data-code={d.code}>
            {d.nodeId ? `${d.nodeId}: ` : ""}
            {d.message}
          </li>
        ))
      ) : (
        <li>{compiled.error.message}</li>
      )}
    </ul>
  );
}
/** Default composition; all pieces can also be used separately. No global CSS is imported. */
export function DeckEditor({
  deck,
  readOnly = false,
  onError,
}: {
  readonly deck: DeckRuntime;
  readonly readOnly?: boolean;
  readonly onError?: (error: LipatError) => void;
}): ReactNode {
  return (
    <DeckProvider deck={deck} readOnly={readOnly}>
      <div className="lipat-editor">
        <HistoryToolbar />
        <SlideTabs />
        <div className="lipat-workspace">
          <SlideCanvas {...(onError ? { onError } : {})} />
          <NodeInspector {...(onError ? { onError } : {})} />
        </div>
        <LayoutDiagnostics />
      </div>
    </DeckProvider>
  );
}
