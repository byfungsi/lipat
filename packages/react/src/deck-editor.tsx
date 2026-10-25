import { createBrowserPlayback } from "@lipat-internal/browser-playback";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";
import {
  createDeckEditorSession,
  createEditorNode,
  findSlideNode,
  deckThemes,
} from "@lipat-internal/core";
import type {
  DeckRuntime,
  DeckEditorSession,
  DeckSaveHandler,
  EditorImageResolver,
  EditorContentKind,
} from "@lipat-internal/core";
import type {
  ElementFrame,
  LipatError,
  LipatResult,
  SlidePlaybackDriver,
} from "@lipat-internal/model";
import {
  DeckProvider,
  useDeck,
  useDeckReadOnly,
  useDeckScene,
  useDeckState,
} from "./deck-context";
import { SlideCanvas } from "./slide-canvas";
import { NodeInspector } from "./node-properties";
import { ScenePlayer } from "./scene-presentation";
import { ThemeProperties } from "./theme-properties";
export { NodeInspector } from "./node-properties";
const palette: readonly EditorContentKind[] = [
  "heading",
  "text",
  "list",
  "shape",
  "table",
  "code",
  "stack",
  "row",
  "grid",
  "canvas",
];
const paletteMime = "application/x-lipat-content";
/** Built-in editor callbacks retain host ownership of persistence, uploads and playback implementations. */
export interface DeckEditorProps {
  readonly deck: DeckRuntime;
  readonly session?: DeckEditorSession;
  readonly readOnly?: boolean;
  readonly onSave?: DeckSaveHandler;
  readonly resolveImage?: EditorImageResolver;
  readonly playback?: SlidePlaybackDriver<HTMLElement>;
  readonly onError?: (error: LipatError) => void;
  readonly className?: string;
}
/** Composable slide navigation follows deck order, including hidden slides while editing. */
export function SlideTabs({
  className,
}: {
  readonly className?: string;
}): ReactNode {
  const deck = useDeck(),
    state = useDeckState(),
    readOnly = useDeckReadOnly();
  return (
    <nav className={className ?? "lipat-tabs"} aria-label="Slides">
      {state.document.slides.map((slide, index) => (
        <button
          key={slide.id}
          type="button"
          draggable={!readOnly}
          aria-current={slide.id === state.activeSlideId ? "page" : undefined}
          onDragStart={(event) =>
            event.dataTransfer.setData("application/x-lipat-slide", slide.id)
          }
          onDragOver={(event) => {
            if (
              !readOnly &&
              event.dataTransfer.types.includes("application/x-lipat-slide")
            )
              event.preventDefault();
          }}
          onDrop={(event) => {
            if (readOnly) return;
            event.preventDefault();
            const id = event.dataTransfer.getData("application/x-lipat-slide");
            if (id) deck.apply([{ type: "moveSlide", slideId: id, index }]);
          }}
          onClick={() => deck.setActiveSlide(slide.id)}
        >
          {index + 1}. {slide.title || slide.id}
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
      <button
        type="button"
        disabled={readOnly || !state.canUndo}
        onClick={() => deck.undo()}
      >
        Undo
      </button>
      <button
        type="button"
        disabled={readOnly || !state.canRedo}
        onClick={() => deck.redo()}
      >
        Redo
      </button>
    </div>
  );
}
/** Diagnostics stay available to both human editors and agent tools. */
export function LayoutDiagnostics(): ReactNode {
  const compiled = useDeckScene();
  return (
    <ul className="lipat-diagnostics" aria-label="Layout diagnostics">
      {compiled.ok ? (
        compiled.value.diagnostics.map((item, index) => (
          <li key={index} data-code={item.code}>
            {item.nodeId ? `${item.nodeId}: ` : ""}
            {item.message}
          </li>
        ))
      ) : (
        <li>{compiled.error.message}</li>
      )}
    </ul>
  );
}
function EditorWorkspace({
  session,
  canSave,
  playback,
  onError,
}: {
  readonly session: DeckEditorSession;
  readonly canSave: boolean;
  readonly playback?: SlidePlaybackDriver<HTMLElement>;
  readonly onError?: (error: LipatError) => void;
}): ReactNode {
  const deck = useDeck(),
    state = useDeckState(),
    readOnly = useDeckReadOnly(),
    compiled = useDeckScene();
  const editor = useSyncExternalStore(
    session.subscribe,
    session.getState,
    session.getState,
  );
  const [error, setError] = useState<LipatError | null>(null),
    [imageUrl, setImageUrl] = useState(""),
    [preview, setPreview] = useState(false),
    [previewKey, setPreviewKey] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const slide = state.document.slides.find(
      (item) => item.id === state.activeSlideId,
    ),
    slideIndex = state.document.slides.findIndex(
      (item) => item.id === state.activeSlideId,
    );
  const report = (result: LipatResult<void>) => {
    if (!result.ok && result.error.reason !== "cancelled") {
      setError(result.error);
      onError?.(result.error);
    } else if (result.ok) setError(null);
  };
  const addContent = (kind: EditorContentKind, frame?: ElementFrame) => {
    const selectedId = state.selection[0];
    const selected =
      slide && selectedId
        ? findSlideNode(slide.content, selectedId)
        : undefined;
    report(
      session.insertNode(
        createEditorNode(kind, session.createNodeId(kind), frame),
        !frame && selected && "children" in selected
          ? { parentId: selected.id }
          : {},
      ),
    );
  };
  async function addFiles(files: readonly File[], frame?: ElementFrame) {
    const slideId = state.activeSlideId;
    for (const file of files) {
      if (file.size > 32 * 1024 * 1024) {
        report({
          ok: false,
          error: {
            reason: "resourceLimit",
            message: "Editor image file exceeds 32 MiB",
          },
        });
        return;
      }
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        report(
          await session.addImage(
            { kind: "bytes", bytes, mimeType: file.type, name: file.name },
            { slideId, ...(frame ? { frame } : {}) },
          ),
        );
      } catch {
        report({
          ok: false,
          error: {
            reason: "imageFailed",
            message: "Editor could not read the selected image file",
          },
        });
      }
    }
  }
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void addFiles(files);
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (readOnly) return;
    event.preventDefault();
    const rect = (
        event.currentTarget.querySelector(".lipat-canvas") ??
        event.currentTarget
      ).getBoundingClientRect(),
      size = state.document.size;
    const frame = {
      x: Math.max(0, ((event.clientX - rect.left) / rect.width) * size.width),
      y: Math.max(0, ((event.clientY - rect.top) / rect.height) * size.height),
      width: 320,
      height: 160,
    };
    const kind = palette.find(
      (item) => item === event.dataTransfer.getData(paletteMime),
    );
    if (kind) addContent(kind, frame);
    else if (event.dataTransfer.files.length)
      void addFiles(Array.from(event.dataTransfer.files), frame);
    else {
      const url = event.dataTransfer
        .getData("text/uri-list")
        .split("\n")
        .find((line) => line && !line.startsWith("#"));
      if (url)
        void session.addImage({ kind: "url", url }, { frame }).then(report);
    }
  };
  return (
    <>
      <div
        className="lipat-editor-toolbar"
        role="toolbar"
        aria-label="Presentation actions"
      >
        <HistoryToolbar />
        {!readOnly ? (
          <>
            <button
              type="button"
              disabled={!canSave || editor.save.status === "pending"}
              onClick={() => void session.save().then(report)}
            >
              {editor.save.status === "pending" ? "Saving…" : "Save"}
            </button>
            <span role="status">
              {editor.save.status === "error"
                ? "Save failed"
                : editor.dirty
                  ? "Unsaved changes"
                  : "Saved"}
            </span>
            <button type="button" onClick={() => report(session.addSlide())}>
              Add slide
            </button>
            <button
              type="button"
              onClick={() =>
                report(session.duplicateSlide(state.activeSlideId))
              }
            >
              Duplicate slide
            </button>
            <button
              type="button"
              disabled={state.document.slides.length <= 1}
              onClick={() =>
                report(
                  deck.apply([
                    { type: "deleteSlide", slideId: state.activeSlideId },
                  ]),
                )
              }
            >
              Delete slide
            </button>
            <button
              type="button"
              disabled={slideIndex <= 0}
              onClick={() =>
                report(
                  deck.apply([
                    {
                      type: "moveSlide",
                      slideId: state.activeSlideId,
                      index: slideIndex - 1,
                    },
                  ]),
                )
              }
            >
              Move slide earlier
            </button>
            <button
              type="button"
              disabled={slideIndex >= state.document.slides.length - 1}
              onClick={() =>
                report(
                  deck.apply([
                    {
                      type: "moveSlide",
                      slideId: state.activeSlideId,
                      index: slideIndex + 1,
                    },
                  ]),
                )
              }
            >
              Move slide later
            </button>
            <button
              type="button"
              disabled={!state.selection.length}
              onClick={() => report(session.duplicateSelection())}
            >
              Duplicate element
            </button>
            <button
              type="button"
              disabled={!state.selection.length}
              onClick={() => report(session.deleteSelection())}
            >
              Delete element
            </button>
            <label>
              Theme
              <select
                aria-label="Deck theme"
                defaultValue=""
                onChange={(event) => {
                  const theme =
                    event.target.value === "midnight"
                      ? deckThemes.midnight
                      : event.target.value === "paper"
                        ? deckThemes.paper
                        : deckThemes.editorial;
                  report(deck.apply([{ type: "setTheme", theme }]));
                }}
              >
                <option value="" disabled>
                  Choose theme
                </option>
                {Object.keys(deckThemes).map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        <button
          type="button"
          aria-pressed={preview}
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Close preview" : "Preview animations"}
        </button>
        {preview ? (
          <button type="button" onClick={() => setPreviewKey((key) => key + 1)}>
            Replay animations
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert">
          {error.message}
          <button type="button" onClick={() => setError(null)}>
            Dismiss error
          </button>
        </p>
      ) : null}
      <SlideTabs />
      {!readOnly ? (
        <div
          className="lipat-content-palette"
          role="toolbar"
          aria-label="Insert content"
        >
          {palette.map((kind) => (
            <button
              key={kind}
              type="button"
              draggable
              onDragStart={(event) =>
                event.dataTransfer.setData(paletteMime, kind)
              }
              onClick={() => addContent(kind)}
            >
              Add {kind}
            </button>
          ))}
          <button
            type="button"
            disabled={editor.image.status === "pending"}
            onClick={() => fileInput.current?.click()}
          >
            Upload image
          </button>
          <input
            ref={fileInput}
            aria-label="Upload image file"
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            multiple
            hidden
            onChange={handleFileChange}
          />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void session
                .addImage({ kind: "url", url: imageUrl })
                .then(report);
            }}
          >
            <input
              type="url"
              required
              aria-label="Insert image URL"
              placeholder="https://…"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
            />
            <button disabled={editor.image.status === "pending"} type="submit">
              Add image URL
            </button>
            {state.selection.length === 1 ? (
              <button
                disabled={editor.image.status === "pending"}
                type="button"
                onClick={() => {
                  const id = state.selection[0];
                  if (id)
                    void session
                      .addImage(
                        { kind: "url", url: imageUrl },
                        { replaceNodeId: id },
                      )
                      .then(report);
                }}
              >
                Replace image URL
              </button>
            ) : null}
          </form>
          {editor.image.status === "pending" ? (
            <>
              <span role="status">Preparing image…</span>
              <button type="button" onClick={() => session.cancelImage()}>
                Cancel image
              </button>
            </>
          ) : null}
        </div>
      ) : null}
      {slide ? (
        <div className="lipat-slide-properties">
          <label>
            Slide title
            <input
              aria-label="Slide title"
              readOnly={readOnly}
              value={slide.title ?? ""}
              onChange={(event) =>
                report(
                  deck.apply([
                    {
                      type: "updateSlide",
                      slideId: slide.id,
                      title: event.target.value,
                    },
                  ]),
                )
              }
            />
          </label>
          <label>
            Slide background
            <input
              type="color"
              aria-label="Slide background"
              disabled={readOnly}
              value={slide.background ?? state.document.theme.background}
              onChange={(event) =>
                report(
                  deck.apply([
                    {
                      type: "updateSlide",
                      slideId: slide.id,
                      background: event.target.value,
                    },
                  ]),
                )
              }
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={slide.hidden ?? false}
              disabled={readOnly}
              onChange={(event) =>
                report(
                  deck.apply([
                    {
                      type: "updateSlide",
                      slideId: slide.id,
                      hidden: event.target.checked,
                    },
                  ]),
                )
              }
            />
            Hidden slide
          </label>
          <label>
            Vertical group
            <select
              value={slide.parentId ?? ""}
              disabled={readOnly}
              onChange={(event) =>
                report(
                  session.setSlideParent(slide.id, event.target.value || null),
                )
              }
            >
              <option value="">Top-level slide</option>
              {state.document.slides
                .slice(0, state.document.slides.indexOf(slide))
                .filter((item) => !item.parentId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    Under {item.title || item.id}
                  </option>
                ))}
            </select>
          </label>
        </div>
      ) : null}
      {!readOnly ? (
        <ThemeProperties
          key={`theme-${state.revision}`}
          onError={(error) => {
            setError(error);
            onError?.(error);
          }}
        />
      ) : null}
      {preview && compiled.ok ? (
        <section aria-label="Animation preview">
          <ScenePlayer
            key={previewKey}
            scene={{
              ...compiled.value.scene,
              slides: compiled.value.scene.slides
                .filter((item) => item.id === state.activeSlideId)
                .map((item) => ({ ...item, hidden: false })),
            }}
            imagePolicy="allow-external"
            {...(playback ? { playback } : {})}
          />
        </section>
      ) : null}
      <div className="lipat-workspace">
        <div
          className="lipat-stage"
          onDragOver={(event) => {
            if (!readOnly) event.preventDefault();
          }}
          onDrop={handleDrop}
        >
          <SlideCanvas
            onError={(error) => {
              setError(error);
              onError?.(error);
            }}
          />
        </div>
        <div>
          <nav className="lipat-layers" aria-label="Layers">
            {deck
              .inspect({ slideId: state.activeSlideId })
              .slides[0]?.nodes.map((node) => (
                <button
                  type="button"
                  key={node.id}
                  aria-pressed={state.selection.includes(node.id)}
                  onClick={() => deck.setSelection([node.id])}
                >
                  {node.type} · {node.id}
                </button>
              ))}
          </nav>
          {!readOnly ? (
            <div role="toolbar" aria-label="Layer order">
              {(["front", "back", "forward", "backward"] as const).map(
                (direction) => (
                  <button
                    key={direction}
                    type="button"
                    disabled={!state.selection.length}
                    onClick={() => report(session.moveLayer(direction))}
                  >
                    Move {direction}
                  </button>
                ),
              )}
            </div>
          ) : null}
          <NodeInspector
            onError={(error) => {
              setError(error);
              onError?.(error);
            }}
          />
        </div>
      </div>
      <LayoutDiagnostics />
    </>
  );
}
/** Ready-to-use drag and drop editor; hosts own Save and image resolution, while components remain separately composable. */
export function DeckEditor(props: DeckEditorProps): ReactNode {
  const defaultPlayback = useMemo(() => createBrowserPlayback(), []);
  const callbacks = useRef(props);
  callbacks.current = props;
  const [owned, setOwned] = useState<{
    readonly deck: DeckRuntime;
    readonly readOnly: boolean;
    readonly session: DeckEditorSession;
  } | null>(null);
  const { deck, readOnly = false, session: external } = props;
  useEffect(() => {
    if (external) return;
    // Getter capabilities retain the latest host callbacks without resetting pending work or dirty state on parent renders.
    const session = createDeckEditorSession(deck, {
      readOnly,
      get onSave() {
        return callbacks.current.onSave;
      },
      get resolveImage() {
        return callbacks.current.resolveImage;
      },
    });
    setOwned({ deck, readOnly, session });
    return () => session.dispose();
  }, [deck, readOnly, external]);
  const session =
    external ??
    (owned?.deck === deck && owned.readOnly === readOnly
      ? owned.session
      : null);
  if (external && external.deck !== deck)
    throw new Error("Lipat editor session belongs to a different deck");
  if (!session) return <p role="status">Preparing editor…</p>;
  return (
    <DeckProvider deck={deck} readOnly={readOnly}>
      <div
        className={props.className ?? "lipat-editor"}
        onKeyDown={(event) => {
          if (readOnly) return;
          const target = event.target;
          if (
            target instanceof Element &&
            target.closest("input,textarea,select,[contenteditable]")
          )
            return;
          const report = (result: LipatResult<void>) => {
            if (!result.ok) props.onError?.(result.error);
          };
          if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "s"
          ) {
            event.preventDefault();
            void session.save().then(report);
          } else if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "z"
          ) {
            event.preventDefault();
            report(event.shiftKey ? deck.redo() : deck.undo());
          } else if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "d"
          ) {
            event.preventDefault();
            report(session.duplicateSelection());
          } else if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            report(session.deleteSelection());
          }
        }}
      >
        <EditorWorkspace
          session={session}
          canSave={Boolean(props.onSave || external)}
          {...{ playback: props.playback ?? defaultPlayback }}
          {...(props.onError ? { onError: props.onError } : {})}
        />
      </div>
    </DeckProvider>
  );
}
