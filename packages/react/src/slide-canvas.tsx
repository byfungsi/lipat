import { useRef, useState } from "react";
import type { ReactNode, PointerEvent } from "react";
import { renderSlideSvg } from "@lipat-internal/render";
import type {
  ElementFrame,
  LipatError,
  SceneElement,
  SlideNode,
} from "@lipat-internal/model";
import {
  useDeck,
  useDeckReadOnly,
  useDeckScene,
  useDeckState,
} from "./deck-context";
function findNode(node: SlideNode, id: string): SlideNode | undefined {
  if (node.id === id) return node;
  if ("children" in node)
    for (const c of node.children) {
      const found = findNode(c, id);
      if (found) return found;
    }
  return undefined;
}
/** Slide canvas supports selection, keyboard nudges and one history entry per drag/resize gesture. */
export function SlideCanvas({
  className,
  onError,
  renderElement,
}: {
  readonly className?: string;
  readonly onError?: (error: LipatError) => void;
  readonly renderElement?: (element: SceneElement) => ReactNode;
}): ReactNode {
  const deck = useDeck(),
    readOnly = useDeckReadOnly(),
    state = useDeckState(),
    compiled = useDeckScene();
  const surface = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    id: string;
    x: number;
    y: number;
    frame: ElementFrame;
    mode: "move" | "resize";
    scale: number;
    revision: number;
  } | null>(null);
  const [offset, setOffset] = useState<{
    id: string;
    dx: number;
    dy: number;
    mode: "move" | "resize";
  } | null>(null);
  if (!compiled.ok) return <p role="alert">{compiled.error.message}</p>;
  const scene = compiled.value.scene,
    slide = scene.slides.find((s) => s.id === state.activeSlideId);
  if (!slide) return null;
  const source = state.document.slides.find((s) => s.id === slide.id);
  const apply = (
    element: SceneElement,
    dx: number,
    dy: number,
    mode: "move" | "resize",
    revision: number,
  ) => {
    const node = source ? findNode(source.content, element.id) : undefined;
    if (!node) return;
    const f = node.frame ?? {
      x: 0,
      y: 0,
      width: element.frame.width,
      height: element.frame.height,
      rotation: element.frame.rotation ?? 0,
    };
    const frame =
      mode === "move"
        ? { ...f, x: f.x + dx, y: f.y + dy }
        : {
            ...f,
            width: Math.max(1, f.width + dx),
            height: Math.max(1, f.height + dy),
          };
    const result = deck.apply(
      [{ type: "setFrame", nodeId: element.id, frame }],
      { expectedRevision: revision },
    );
    if (!result.ok) onError?.(result.error);
  };
  const start = (
    event: PointerEvent<HTMLElement>,
    element: SceneElement,
    mode: "move" | "resize",
  ) => {
    if (readOnly) return;
    event.preventDefault();
    const selection = event.shiftKey
      ? [...state.selection, element.id]
      : [element.id];
    const r = deck.setSelection(selection);
    if (!r.ok) onError?.(r.error);
    const width =
      surface.current?.getBoundingClientRect().width ?? scene.size.width;
    gesture.current = {
      id: element.id,
      x: event.clientX,
      y: event.clientY,
      frame: element.frame,
      mode,
      scale: scene.size.width / width,
      revision: state.revision,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  return (
    <div
      ref={surface}
      className={className ?? "lipat-canvas"}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `${scene.size.width}/${scene.size.height}`,
      }}
      onPointerMove={(event) => {
        const g = gesture.current;
        if (g)
          setOffset({
            id: g.id,
            dx: (event.clientX - g.x) * g.scale,
            dy: (event.clientY - g.y) * g.scale,
            mode: g.mode,
          });
      }}
      onPointerUp={(event) => {
        const g = gesture.current;
        gesture.current = null;
        setOffset(null);
        if (g) {
          const e = slide.elements.find((e) => e.id === g.id);
          const dx = (event.clientX - g.x) * g.scale,
            dy = (event.clientY - g.y) * g.scale;
          if (e && (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1))
            apply(e, dx, dy, g.mode, g.revision);
        }
      }}
      onPointerCancel={() => {
        gesture.current = null;
        setOffset(null);
      }}
    >
      <div
        dangerouslySetInnerHTML={{ __html: renderSlideSvg(scene, slide.id) }}
      />
      {!readOnly
        ? slide.elements.map((element) => {
            const f = element.frame,
              selected = state.selection.includes(element.id);
            const delta = offset?.id === element.id ? offset : null;
            return (
              <div
                key={element.id}
                role="button"
                tabIndex={
                  selected ||
                  (state.selection.length === 0 &&
                    slide.elements[0]?.id === element.id)
                    ? 0
                    : -1
                }
                aria-label={`Select ${element.id}`}
                aria-pressed={selected}
                onFocus={() => {
                  if (!state.selection.includes(element.id))
                    deck.setSelection([element.id]);
                }}
                data-selected={selected || undefined}
                style={{
                  position: "absolute",
                  left: `${((f.x + (delta?.mode === "move" ? delta.dx : 0)) / scene.size.width) * 100}%`,
                  top: `${((f.y + (delta?.mode === "move" ? delta.dy : 0)) / scene.size.height) * 100}%`,
                  width: `${((f.width + (delta?.mode === "resize" ? delta.dx : 0)) / scene.size.width) * 100}%`,
                  height: `${((f.height + (delta?.mode === "resize" ? delta.dy : 0)) / scene.size.height) * 100}%`,
                  boxSizing: "border-box",
                  border: selected
                    ? "2px solid #5B5BD6"
                    : "2px solid transparent",
                  cursor: "move",
                }}
                onPointerDown={(e) => start(e, element, "move")}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    gesture.current = null;
                    setOffset(null);
                    return;
                  }
                  const amount = event.shiftKey ? 10 : 1;
                  const delta =
                    event.key === "ArrowLeft"
                      ? [-amount, 0]
                      : event.key === "ArrowRight"
                        ? [amount, 0]
                        : event.key === "ArrowUp"
                          ? [0, -amount]
                          : event.key === "ArrowDown"
                            ? [0, amount]
                            : null;
                  if (delta) {
                    event.preventDefault();
                    apply(
                      element,
                      delta[0] ?? 0,
                      delta[1] ?? 0,
                      "move",
                      state.revision,
                    );
                  }
                }}
              >
                {renderElement?.(element)}
                {selected ? (
                  <button
                    aria-label={`Resize ${element.id}`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      start(e, element, "resize");
                    }}
                    style={{
                      position: "absolute",
                      right: -5,
                      bottom: -5,
                      width: 12,
                      height: 12,
                      padding: 0,
                      cursor: "nwse-resize",
                      background: "#5B5BD6",
                      border: "1px solid white",
                    }}
                  />
                ) : null}
              </div>
            );
          })
        : null}
    </div>
  );
}
