import { useMemo, useRef, useState } from "react";
import type { ReactNode, PointerEvent } from "react";
import { renderSceneElementSvg, renderSlideSvg } from "@lipat-internal/render";
import type {
  DeckOperation,
  ElementFrame,
  LipatError,
  SceneElement,
  SlideScene,
} from "@lipat-internal/model";
import {
  useDeck,
  useDeckReadOnly,
  useDeckScene,
  useDeckState,
} from "./deck-context";
function DraggedPrimitive({
  scene,
  element,
  frame,
  mode,
}: {
  readonly scene: SlideScene;
  readonly element: SceneElement;
  readonly frame: ElementFrame;
  readonly mode: "move" | "resize";
}): ReactNode {
  const width = mode === "resize" ? frame.width : element.frame.width,
    height = mode === "resize" ? frame.height : element.frame.height;
  const markup = useMemo(
    () =>
      renderSceneElementSvg(
        scene,
        { ...element, frame: { ...element.frame, width, height } },
        { imagePolicy: "allow-external" },
      ),
    [scene, element, width, height],
  );
  return (
    <div
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
interface CanvasGesture {
  readonly slideId: string;
  readonly ids: readonly string[];
  readonly x: number;
  readonly y: number;
  readonly mode: "move" | "resize";
  readonly scale: number;
  readonly revision: number;
  readonly rotation: number;
}
/** Slide canvas supports touch/pointer selection, multi-element movement and one history entry per drag or resize. */
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
  const surface = useRef<HTMLDivElement>(null),
    gesture = useRef<CanvasGesture | null>(null);
  const [offset, setOffset] = useState<{
    readonly ids: readonly string[];
    readonly dx: number;
    readonly dy: number;
    readonly mode: "move" | "resize";
  } | null>(null);
  const scene = compiled.ok ? compiled.value.scene : undefined;
  const slide = scene?.slides.find((item) => item.id === state.activeSlideId);
  const movingIds = offset?.ids;
  const baseMarkup = useMemo(() => {
    if (!scene || !slide) return "";
    const rendered = movingIds
      ? {
          ...scene,
          slides: scene.slides.map((item) =>
            item.id === slide.id
              ? {
                  ...item,
                  elements: item.elements.filter(
                    (element) => !movingIds.includes(element.id),
                  ),
                }
              : item,
          ),
        }
      : scene;
    return renderSlideSvg(rendered, slide.id);
  }, [scene, slide, movingIds]);
  if (!compiled.ok) return <p role="alert">{compiled.error.message}</p>;
  if (!scene || !slide) return null;
  const changeFrame = (
    frame: ElementFrame,
    dx: number,
    dy: number,
    mode: "move" | "resize",
  ): ElementFrame =>
    mode === "move"
      ? { ...frame, x: frame.x + dx, y: frame.y + dy }
      : {
          ...frame,
          width: Math.max(1, frame.width + dx),
          height: Math.max(1, frame.height + dy),
        };
  const commit = (
    ids: readonly string[],
    dx: number,
    dy: number,
    mode: "move" | "resize",
    revision: number,
  ) => {
    if (readOnly) return;
    const operations: DeckOperation[] = slide.elements
      .filter((element) => ids.includes(element.id))
      .map((element) => ({
        type: "setFrame",
        nodeId: element.id,
        frame: changeFrame(element.frame, dx, dy, mode),
      }));
    if (!operations.length) return;
    const result = deck.applyToCanvas(slide.id, operations, {
      expectedRevision: revision,
    });
    if (!result.ok) onError?.(result.error);
  };
  const start = (
    event: PointerEvent<HTMLElement>,
    element: SceneElement,
    mode: "move" | "resize",
  ) => {
    if (readOnly || event.button !== 0) return;
    event.preventDefault();
    const selection =
      mode === "resize"
        ? [element.id]
        : event.shiftKey
          ? [...new Set([...state.selection, element.id])]
          : state.selection.includes(element.id)
            ? state.selection
            : [element.id];
    const result = deck.setSelection(selection);
    if (!result.ok) {
      onError?.(result.error);
      return;
    }
    const width =
      surface.current?.getBoundingClientRect().width ?? scene.size.width;
    gesture.current = {
      slideId: slide.id,
      ids: selection,
      x: event.clientX,
      y: event.clientY,
      mode,
      scale: scene.size.width / Math.max(1, width),
      revision: state.revision,
      rotation: element.frame.rotation ?? 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const delta = (event: PointerEvent<HTMLElement>, g: CanvasGesture) => {
    const x = (event.clientX - g.x) * g.scale,
      y = (event.clientY - g.y) * g.scale,
      angle = (g.rotation * Math.PI) / 180;
    return g.mode === "resize"
      ? {
          dx: x * Math.cos(angle) + y * Math.sin(angle),
          dy: -x * Math.sin(angle) + y * Math.cos(angle),
        }
      : { dx: x, dy: y };
  };
  const cancel = () => {
    gesture.current = null;
    setOffset(null);
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
        if (g && !readOnly)
          setOffset({ ids: g.ids, ...delta(event, g), mode: g.mode });
      }}
      onPointerUp={(event) => {
        const g = gesture.current;
        cancel();
        if (g && g.slideId === slide.id) {
          const { dx, dy } = delta(event, g);
          if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1)
            commit(g.ids, dx, dy, g.mode, g.revision);
        }
      }}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
      onKeyDown={(event) => {
        if (event.key === "Escape") cancel();
      }}
    >
      <div
        dangerouslySetInnerHTML={{
          __html: baseMarkup,
        }}
      />
      {!readOnly
        ? slide.elements.map((element) => {
            const selected = state.selection.includes(element.id),
              d = offset?.ids.includes(element.id) ? offset : null,
              f = d
                ? changeFrame(element.frame, d.dx, d.dy, d.mode)
                : element.frame;
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
                  left: `${(f.x / scene.size.width) * 100}%`,
                  top: `${(f.y / scene.size.height) * 100}%`,
                  width: `${(f.width / scene.size.width) * 100}%`,
                  height: `${(f.height / scene.size.height) * 100}%`,
                  transform: `rotate(${f.rotation ?? 0}deg)`,
                  boxSizing: "border-box",
                  outline: selected ? "2px solid #5B5BD6" : "none",
                  outlineOffset: -2,
                  cursor: "move",
                  touchAction: "none",
                }}
                onPointerDown={(event) => start(event, element, "move")}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  const amount = event.shiftKey ? 10 : 1,
                    dx =
                      event.key === "ArrowLeft"
                        ? -amount
                        : event.key === "ArrowRight"
                          ? amount
                          : 0,
                    dy =
                      event.key === "ArrowUp"
                        ? -amount
                        : event.key === "ArrowDown"
                          ? amount
                          : 0;
                  if (dx || dy) {
                    event.preventDefault();
                    commit(
                      state.selection.includes(element.id)
                        ? state.selection
                        : [element.id],
                      dx,
                      dy,
                      "move",
                      state.revision,
                    );
                  }
                }}
              >
                {d ? (
                  <DraggedPrimitive
                    scene={scene}
                    element={element}
                    frame={f}
                    mode={d.mode}
                  />
                ) : null}
                {renderElement?.(element)}
                {selected ? (
                  <button
                    type="button"
                    aria-label={`Resize ${element.id}`}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      start(event, element, "resize");
                    }}
                    onKeyDown={(event) => {
                      const amount = event.shiftKey ? 10 : 1,
                        dx =
                          event.key === "ArrowLeft"
                            ? -amount
                            : event.key === "ArrowRight"
                              ? amount
                              : 0,
                        dy =
                          event.key === "ArrowUp"
                            ? -amount
                            : event.key === "ArrowDown"
                              ? amount
                              : 0;
                      if (dx || dy) {
                        event.preventDefault();
                        event.stopPropagation();
                        commit([element.id], dx, dy, "resize", state.revision);
                      }
                    }}
                    style={{
                      position: "absolute",
                      right: -5,
                      bottom: -5,
                      width: 12,
                      height: 12,
                      padding: 0,
                      cursor: "nwse-resize",
                      touchAction: "none",
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
