import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import {
  createDeckEditorSession,
  createEditorNode,
  deckThemes,
  findSlideNode,
} from "@lipat-internal/core";
import type {
  DeckRuntime,
  DeckEditorSession,
  DeckSaveHandler,
  EditorImageInput,
  EditorImageResolver,
  EditorContentKind,
} from "@lipat-internal/core";
import type { LipatError, LipatResult } from "@lipat-internal/model";
import type { ImageRenderPolicy } from "@lipat-internal/render";
import { NativeSceneSlide } from "./native-scene";
import { NativeEditorCanvas } from "./native-editor-canvas";
import { NativeNodeProperties } from "./native-node-properties";
import { NativeThemeProperties } from "./native-theme-properties";
import {
  nativeEditorStyles,
  NativeEditorButton,
  NativeEditorField,
} from "./native-editor-controls";
/** Native editor accepts a host picker and asynchronous image resolver; storage, credentials and native picker dependencies stay in the app. */
export interface NativeDeckEditorProps {
  readonly deck: DeckRuntime;
  readonly session?: DeckEditorSession;
  readonly onSave?: DeckSaveHandler;
  readonly resolveImage?: EditorImageResolver;
  readonly onPickImage?: () => Promise<LipatResult<EditorImageInput | null>>;
  readonly readOnly?: boolean;
  readonly imagePolicy?: ImageRenderPolicy;
  readonly onError?: (error: LipatError) => void;
  readonly style?: StyleProp<ViewStyle>;
}
function NativeSlideBackground({
  deck,
  slideId,
  value,
  report,
}: {
  readonly deck: DeckRuntime;
  readonly slideId: string;
  readonly value: string;
  readonly report: (result: LipatResult<void>) => void;
}): ReactNode {
  const [draft, setDraft] = useState(value);
  return (
    <View style={nativeEditorStyles.panel}>
      <NativeEditorField
        label="Slide background"
        value={draft}
        onChange={setDraft}
      />
      <NativeEditorButton
        label="Apply slide background"
        onPress={() =>
          report(
            deck.apply([{ type: "updateSlide", slideId, background: draft }]),
          )
        }
      />
    </View>
  );
}
function NativeEditorWorkspace({
  props,
  session,
}: {
  readonly props: NativeDeckEditorProps;
  readonly session: DeckEditorSession;
}): ReactNode {
  const { deck, readOnly = false, imagePolicy = "allow-external" } = props,
    state = useSyncExternalStore(deck.subscribe, deck.getState, deck.getState),
    editor = useSyncExternalStore(
      session.subscribe,
      session.getState,
      session.getState,
    );
  const [error, setError] = useState<LipatError | null>(null),
    [url, setUrl] = useState(""),
    [preview, setPreview] = useState(false),
    [previewKey, setPreviewKey] = useState(0),
    [reveal, setReveal] = useState(0);
  const slide = state.document.slides.find(
      (item) => item.id === state.activeSlideId,
    ),
    id = state.selection[0],
    node = slide && id ? findSlideNode(slide.content, id) : undefined;
  const compiled = useMemo(() => deck.compile(), [deck, state.document]),
    resolved = compiled.ok
      ? compiled.value.scene.slides.find((item) => item.id === slide?.id)
      : undefined;
  const report = (result: LipatResult<void>) => {
    if (!result.ok && result.error.reason !== "cancelled") {
      setError(result.error);
      props.onError?.(result.error);
    } else if (result.ok) setError(null);
  };
  const reportError = (value: LipatError) => {
    setError(value);
    props.onError?.(value);
  };
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
  return (
    <ScrollView
      style={props.style}
      contentContainerStyle={nativeEditorStyles.editor}
      keyboardShouldPersistTaps="handled"
    >
      <View style={nativeEditorStyles.bar}>
        {!readOnly ? (
          <>
            <NativeEditorButton
              label="Undo"
              disabled={!state.canUndo}
              onPress={() => report(deck.undo())}
            />
            <NativeEditorButton
              label="Redo"
              disabled={!state.canRedo}
              onPress={() => report(deck.redo())}
            />
            <NativeEditorButton
              label={editor.save.status === "pending" ? "Saving…" : "Save"}
              disabled={
                (!props.onSave && !props.session) ||
                editor.save.status === "pending"
              }
              onPress={() => void session.save().then(report)}
            />
            <Text accessibilityLiveRegion="polite">
              {editor.dirty ? "Unsaved changes" : "Saved"}
            </Text>
          </>
        ) : null}
        <NativeEditorButton
          label="Preview animations"
          selected={preview}
          onPress={() => {
            setPreview(!preview);
            setReveal(0);
            setPreviewKey((value) => value + 1);
          }}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={nativeEditorStyles.error}>
          {error.message}
        </Text>
      ) : null}
      <ScrollView horizontal>
        <View style={nativeEditorStyles.bar}>
          {state.document.slides.map((item, index) => (
            <NativeEditorButton
              key={item.id}
              label={`${index + 1}. ${item.title || item.id}`}
              selected={item.id === state.activeSlideId}
              onPress={() => {
                deck.setActiveSlide(item.id);
                setReveal(0);
                setPreviewKey((value) => value + 1);
              }}
            />
          ))}
        </View>
      </ScrollView>
      {!readOnly ? (
        <>
          <View style={nativeEditorStyles.bar}>
            <NativeEditorButton
              label="Add slide"
              onPress={() => report(session.addSlide())}
            />
            <NativeEditorButton
              label="Duplicate slide"
              onPress={() =>
                report(session.duplicateSlide(state.activeSlideId))
              }
            />
            <NativeEditorButton
              label="Delete slide"
              disabled={state.document.slides.length <= 1}
              onPress={() =>
                report(
                  deck.apply([
                    { type: "deleteSlide", slideId: state.activeSlideId },
                  ]),
                )
              }
            />
            <NativeEditorButton
              label="Slide earlier"
              disabled={state.document.slides[0]?.id === slide?.id}
              onPress={() =>
                report(
                  deck.apply([
                    {
                      type: "moveSlide",
                      slideId: state.activeSlideId,
                      index: Math.max(
                        0,
                        state.document.slides.findIndex(
                          (item) => item.id === state.activeSlideId,
                        ) - 1,
                      ),
                    },
                  ]),
                )
              }
            />
            <NativeEditorButton
              label="Slide later"
              disabled={state.document.slides.at(-1)?.id === slide?.id}
              onPress={() =>
                report(
                  deck.apply([
                    {
                      type: "moveSlide",
                      slideId: state.activeSlideId,
                      index: Math.min(
                        state.document.slides.length - 1,
                        state.document.slides.findIndex(
                          (item) => item.id === state.activeSlideId,
                        ) + 1,
                      ),
                    },
                  ]),
                )
              }
            />
          </View>
          <View style={nativeEditorStyles.bar}>
            {palette.map((kind) => (
              <NativeEditorButton
                key={kind}
                label={`Add ${kind}`}
                onPress={() =>
                  report(
                    session.insertNode(
                      createEditorNode(kind, session.createNodeId(kind)),
                      node && "children" in node ? { parentId: node.id } : {},
                    ),
                  )
                }
              />
            ))}
          </View>
          <NativeEditorField label="Image URL" value={url} onChange={setUrl} />
          <View style={nativeEditorStyles.bar}>
            <NativeEditorButton
              label="Add image URL"
              disabled={editor.image.status === "pending"}
              onPress={() =>
                void session.addImage({ kind: "url", url }).then(report)
              }
            />
            {node?.type === "image" ? (
              <NativeEditorButton
                label="Replace image URL"
                disabled={editor.image.status === "pending"}
                onPress={() =>
                  void session
                    .addImage({ kind: "url", url }, { replaceNodeId: node.id })
                    .then(report)
                }
              />
            ) : null}
            {props.onPickImage ? (
              <NativeEditorButton
                label="Upload image"
                disabled={editor.image.status === "pending"}
                onPress={() => {
                  void (async () => {
                    try {
                      const result = await props.onPickImage?.();
                      if (!result) return;
                      if (!result.ok) report(result);
                      else if (result.value)
                        report(await session.addImage(result.value));
                    } catch {
                      reportError({
                        reason: "imageFailed",
                        message: "Editor image picker failed",
                      });
                    }
                  })();
                }}
              />
            ) : null}
            {editor.image.status === "pending" ? (
              <>
                <Text>Preparing image…</Text>
                <NativeEditorButton
                  label="Cancel image"
                  onPress={() => session.cancelImage()}
                />
              </>
            ) : null}
          </View>
        </>
      ) : null}
      {preview && compiled.ok && resolved ? (
        <>
          <NativeSceneSlide
            key={`${resolved.id}-${previewKey}`}
            scene={compiled.value.scene}
            slide={resolved}
            step={reveal}
            imagePolicy={imagePolicy}
          />
          <View style={nativeEditorStyles.bar}>
            <NativeEditorButton
              label="Next reveal"
              onPress={() =>
                setReveal((value) =>
                  Math.min(
                    resolved.elements.reduce(
                      (max, element) => Math.max(max, element.step ?? 0),
                      0,
                    ),
                    value + 1,
                  ),
                )
              }
            />
            <NativeEditorButton
              label="Replay animations"
              onPress={() => {
                setReveal(0);
                setPreviewKey((value) => value + 1);
              }}
            />
          </View>
        </>
      ) : (
        <NativeEditorCanvas
          deck={deck}
          readOnly={readOnly}
          imagePolicy={imagePolicy}
          onError={reportError}
        />
      )}
      <Text style={nativeEditorStyles.heading}>Layers</Text>
      <View style={nativeEditorStyles.bar}>
        {deck
          .inspect({ slideId: state.activeSlideId })
          .slides[0]?.nodes.map((item) => (
            <NativeEditorButton
              key={item.id}
              label={`${item.type} · ${item.id}`}
              selected={state.selection.includes(item.id)}
              onPress={() => deck.setSelection([item.id])}
            />
          ))}
      </View>
      {!readOnly ? (
        <>
          <View style={nativeEditorStyles.bar}>
            <NativeEditorButton
              label="Duplicate element"
              disabled={!state.selection.length}
              onPress={() => report(session.duplicateSelection())}
            />
            <NativeEditorButton
              label="Delete element"
              disabled={!state.selection.length}
              onPress={() => report(session.deleteSelection())}
            />
            {(["front", "back", "forward", "backward"] as const).map(
              (direction) => (
                <NativeEditorButton
                  key={direction}
                  label={`Move ${direction}`}
                  disabled={!state.selection.length}
                  onPress={() => report(session.moveLayer(direction))}
                />
              ),
            )}
          </View>
          {node ? (
            <NativeNodeProperties
              key={`${node.id}-${state.revision}`}
              deck={deck}
              node={node}
              onError={reportError}
            />
          ) : null}
          {slide ? (
            <>
              <NativeEditorField
                label="Slide title"
                value={slide.title ?? ""}
                onChange={(value) =>
                  report(
                    deck.apply([
                      { type: "updateSlide", slideId: slide.id, title: value },
                    ]),
                  )
                }
              />
              <NativeSlideBackground
                key={`${slide.id}-${slide.background ?? state.document.theme.background}`}
                deck={deck}
                slideId={slide.id}
                value={slide.background ?? state.document.theme.background}
                report={report}
              />
              <NativeEditorField
                label="Speaker notes"
                value={slide.notes ?? ""}
                multiline
                onChange={(value) =>
                  report(
                    deck.apply([
                      { type: "updateSlide", slideId: slide.id, notes: value },
                    ]),
                  )
                }
              />
              <NativeEditorButton
                label="Hidden slide"
                selected={slide.hidden ?? false}
                onPress={() =>
                  report(
                    deck.apply([
                      {
                        type: "updateSlide",
                        slideId: slide.id,
                        hidden: !slide.hidden,
                      },
                    ]),
                  )
                }
              />
              <Text style={nativeEditorStyles.heading}>Vertical group</Text>
              <View style={nativeEditorStyles.bar}>
                <NativeEditorButton
                  label="Top-level slide"
                  selected={!slide.parentId}
                  onPress={() => report(session.setSlideParent(slide.id, null))}
                />
                {state.document.slides
                  .slice(0, state.document.slides.indexOf(slide))
                  .filter((item) => !item.parentId)
                  .map((item) => (
                    <NativeEditorButton
                      key={item.id}
                      label={`Under ${item.title || item.id}`}
                      selected={slide.parentId === item.id}
                      onPress={() =>
                        report(session.setSlideParent(slide.id, item.id))
                      }
                    />
                  ))}
              </View>
            </>
          ) : null}
          <View style={nativeEditorStyles.bar}>
            {(["editorial", "midnight", "paper"] as const).map((theme) => (
              <NativeEditorButton
                key={theme}
                label={`${theme} theme`}
                onPress={() =>
                  report(
                    deck.apply([
                      { type: "setTheme", theme: deckThemes[theme] },
                    ]),
                  )
                }
              />
            ))}
          </View>
        </>
      ) : null}
      {!readOnly ? (
        <NativeThemeProperties
          key={`theme-${state.revision}`}
          deck={deck}
          onError={reportError}
        />
      ) : null}
      {compiled.ok ? (
        compiled.value.diagnostics.map((item, index) => (
          <Text key={index}>{item.message}</Text>
        ))
      ) : (
        <Text accessibilityRole="alert">{compiled.error.message}</Text>
      )}
    </ScrollView>
  );
}
/** Native built-in editor shares atomic history, save/upload workflows and animation data with the browser editor; hosts retain runtime ownership. */
export function NativeDeckEditor(props: NativeDeckEditorProps): ReactNode {
  const callbacks = useRef(props);
  callbacks.current = props;
  const { deck, readOnly = false, session: external } = props;
  const [owned, setOwned] = useState<{
    readonly deck: DeckRuntime;
    readonly readOnly: boolean;
    readonly session: DeckEditorSession;
  } | null>(null);
  useEffect(() => {
    if (external) return;
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
    throw new Error("Lipat native editor session belongs to a different deck");
  return session ? (
    <NativeEditorWorkspace props={props} session={session} />
  ) : (
    <Text>Preparing editor…</Text>
  );
}
