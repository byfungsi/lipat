import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { PanResponder, Pressable, Text, View } from "react-native";
import type { PanResponderGestureState } from "react-native";
import { SvgXml } from "react-native-svg";
import type { DeckRuntime } from "@lipat-internal/core";
import type {
  ElementFrame,
  LipatError,
  SceneElement,
  SlideScene,
} from "@lipat-internal/model";
import { renderSceneElementSvg } from "@lipat-internal/render";
import type { ImageRenderPolicy } from "@lipat-internal/render";
import { NativeSceneSlide } from "./native-scene";
import { nativeEditorStyles } from "./native-editor-controls";
function NativeHandle({
  resize,
  begin,
  move,
  finish,
  cancel,
}: {
  readonly resize: boolean;
  readonly begin: (resize: boolean) => void;
  readonly move: (state: PanResponderGestureState) => void;
  readonly finish: (state: PanResponderGestureState) => void;
  readonly cancel: () => void;
}): ReactNode {
  const callbacks = useRef({ begin, move, finish, cancel });
  callbacks.current = { begin, move, finish, cancel };
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, state) =>
          Math.abs(state.dx) + Math.abs(state.dy) > 3,
        onPanResponderGrant: () => callbacks.current.begin(resize),
        onPanResponderMove: (_event, state) => callbacks.current.move(state),
        onPanResponderRelease: (_event, state) =>
          callbacks.current.finish(state),
        onPanResponderTerminate: () => callbacks.current.cancel(),
        onPanResponderTerminationRequest: () => false,
      }),
    [resize],
  );
  return (
    <View
      accessibilityLabel={
        resize ? "Resize selected element" : "Drag selected element"
      }
      {...responder.panHandlers}
      style={
        resize
          ? nativeEditorStyles.resize
          : { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }
      }
    />
  );
}
function NativeCanvasElement({
  deck,
  scene,
  element,
  scale,
  imagePolicy,
  onError,
}: {
  readonly deck: DeckRuntime;
  readonly scene: SlideScene;
  readonly element: SceneElement;
  readonly scale: number;
  readonly imagePolicy: ImageRenderPolicy;
  readonly onError: (error: LipatError) => void;
}): ReactNode {
  const state = useSyncExternalStore(
      deck.subscribe,
      deck.getState,
      deck.getState,
    ),
    selected = state.selection.includes(element.id);
  const [delta, setDelta] = useState({ dx: 0, dy: 0, resize: false });
  const gesture = useRef<{
    revision: number;
    frame: ElementFrame;
    resize: boolean;
    slideId: string;
  } | null>(null);
  const frame = element.frame,
    displayed = {
      ...frame,
      x: frame.x + (delta.resize ? 0 : delta.dx),
      y: frame.y + (delta.resize ? 0 : delta.dy),
      width: Math.max(1, frame.width + (delta.resize ? delta.dx : 0)),
      height: Math.max(1, frame.height + (delta.resize ? delta.dy : 0)),
    };
  const xml = useMemo(
    () =>
      renderSceneElementSvg(
        scene,
        {
          ...element,
          frame: { ...frame, width: displayed.width, height: displayed.height },
        },
        { imagePolicy },
      ),
    [scene, element, frame, displayed.width, displayed.height, imagePolicy],
  );
  const reset = () => {
    gesture.current = null;
    setDelta({ dx: 0, dy: 0, resize: false });
  };
  const change = (motion: PanResponderGestureState) => {
    const g = gesture.current;
    if (!g) return { dx: 0, dy: 0 };
    const angle = ((g.frame.rotation ?? 0) * Math.PI) / 180,
      x = motion.dx / scale,
      y = motion.dy / scale;
    return g.resize
      ? {
          dx: x * Math.cos(angle) + y * Math.sin(angle),
          dy: -x * Math.sin(angle) + y * Math.cos(angle),
        }
      : { dx: x, dy: y };
  };
  return (
    <View
      style={{
        position: "absolute",
        left: displayed.x * scale,
        top: displayed.y * scale,
        width: displayed.width * scale,
        height: displayed.height * scale,
        transform: [{ rotate: `${frame.rotation ?? 0}deg` }],
      }}
    >
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <SvgXml xml={xml} width="100%" height="100%" />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select ${element.id}`}
        accessibilityState={{ selected }}
        onPress={() => deck.setSelection([element.id])}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          borderWidth: selected ? 2 : 0,
          borderColor: "#5B5BD6",
        }}
      />
      {[false, ...(selected ? [true] : [])].map((resize) => (
        <NativeHandle
          key={resize ? "resize" : "move"}
          resize={resize}
          begin={(mode) => {
            deck.setSelection([element.id]);
            gesture.current = {
              revision: deck.getState().revision,
              frame: element.frame,
              resize: mode,
              slideId: deck.getState().activeSlideId,
            };
          }}
          move={(motion) => {
            const g = gesture.current;
            if (g) setDelta({ ...change(motion), resize: g.resize });
          }}
          finish={(motion) => {
            const g = gesture.current,
              { dx, dy } = change(motion);
            reset();
            if (
              !g ||
              deck.getState().activeSlideId !== g.slideId ||
              Math.abs(dx) + Math.abs(dy) < 0.1
            )
              return;
            const result = deck.applyToCanvas(
              g.slideId,
              [
                {
                  type: "setFrame",
                  nodeId: element.id,
                  frame: g.resize
                    ? {
                        ...g.frame,
                        width: Math.max(1, g.frame.width + dx),
                        height: Math.max(1, g.frame.height + dy),
                      }
                    : { ...g.frame, x: g.frame.x + dx, y: g.frame.y + dy },
                },
              ],
              { expectedRevision: g.revision },
            );
            if (!result.ok) onError(result.error);
          }}
          cancel={reset}
        />
      ))}
    </View>
  );
}
/** Touch movement/resizing uses resolved geometry and commits one revision-checked canvas transaction per gesture. */
export function NativeEditorCanvas({
  deck,
  readOnly,
  imagePolicy,
  onError,
}: {
  readonly deck: DeckRuntime;
  readonly readOnly: boolean;
  readonly imagePolicy: ImageRenderPolicy;
  readonly onError: (error: LipatError) => void;
}): ReactNode {
  const state = useSyncExternalStore(
      deck.subscribe,
      deck.getState,
      deck.getState,
    ),
    [width, setWidth] = useState(0),
    compiled = useMemo(() => deck.compile(), [deck, state.document]);
  if (!compiled.ok)
    return <Text accessibilityRole="alert">{compiled.error.message}</Text>;
  const scene = compiled.value.scene,
    slide = scene.slides.find((item) => item.id === state.activeSlideId);
  if (!slide) return null;
  return readOnly ? (
    <NativeSceneSlide scene={scene} slide={slide} imagePolicy={imagePolicy} />
  ) : (
    <View
      style={[
        nativeEditorStyles.canvas,
        {
          aspectRatio: scene.size.width / scene.size.height,
          backgroundColor: slide.background,
        },
      ]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0
        ? slide.elements.map((element) => (
            <NativeCanvasElement
              key={element.id}
              deck={deck}
              scene={scene}
              element={element}
              scale={width / scene.size.width}
              imagePolicy={imagePolicy}
              onError={onError}
            />
          ))
        : null}
    </View>
  );
}
