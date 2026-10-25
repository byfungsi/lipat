import {
  getEntranceInitialFrame,
  getEntranceEasing,
} from "@lipat-internal/model";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import { renderSceneElementSvg, renderSlideSvg } from "@lipat-internal/render";
import type { ImageRenderPolicy } from "@lipat-internal/render";
import type {
  SceneElement,
  SceneSlide,
  SlideScene,
} from "@lipat-internal/model";

const styles = StyleSheet.create({
  surface: { width: "100%", overflow: "hidden" },
  button: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#D9DCE7",
    borderRadius: 7,
    borderCurve: "continuous",
    backgroundColor: "#FFFFFF",
  },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 10,
  },
  disabled: { opacity: 0.4 },
  caption: { padding: 10, color: "#172033" },
});
/** Native preview requires only an immutable scene and never initializes a parser, authoring runtime or WebView. */
export interface NativeScenePreviewProps {
  readonly scene: SlideScene;
  readonly title?: string;
  readonly onOpen?: () => void;
  readonly imagePolicy?: ImageRenderPolicy;
  readonly style?: StyleProp<ViewStyle>;
}
/** Native player uses portable reveal steps and entrance animation data, respecting the operating system's reduced motion preference. */
export interface NativeScenePlayerProps {
  readonly scene: SlideScene;
  readonly imagePolicy?: ImageRenderPolicy;
  readonly style?: StyleProp<ViewStyle>;
  readonly reduceMotion?: boolean;
}
function NativeButton({
  label,
  onPress,
  disabled = false,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
}): ReactNode {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled ? styles.disabled : null]}
    >
      <Text>{label}</Text>
    </Pressable>
  );
}
function useReducedMotion(explicit: boolean | undefined): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(explicit ?? null);
  useEffect(() => {
    if (explicit !== undefined) {
      setEnabled(explicit);
      return;
    }
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => {
        if (alive) setEnabled(value);
      },
      () => {
        if (alive) setEnabled(true);
      },
    );
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setEnabled,
    );
    return () => {
      alive = false;
      subscription.remove();
    };
  }, [explicit]);
  return explicit ?? enabled;
}
function AnimatedPrimitive({
  scene,
  element,
  scale,
  step,
  imagePolicy,
  reduceMotion,
}: {
  readonly scene: SlideScene;
  readonly element: SceneElement;
  readonly scale: number;
  readonly step: number;
  readonly imagePolicy: ImageRenderPolicy;
  readonly reduceMotion: boolean | null;
}): ReactNode {
  const visible = (element.step ?? 0) <= step,
    animation = element.animation;
  const value = useRef(
    new Animated.Value(
      visible && (!animation || reduceMotion === true) ? 1 : 0,
    ),
  ).current;
  const revealed = useRef(false);
  useLayoutEffect(() => {
    revealed.current = false;
  }, [scene]);
  useLayoutEffect(() => {
    value.stopAnimation();
    if (!visible) {
      revealed.current = false;
      value.setValue(0);
      return;
    }
    if (!animation || reduceMotion === true) {
      value.setValue(1);
      revealed.current = true;
      return;
    }
    if (reduceMotion === null) return;
    if (revealed.current) {
      value.setValue(1);
      return;
    }
    revealed.current = true;
    value.setValue(0);
    const curve = getEntranceEasing(animation.easing);
    const easing = curve === "linear" ? Easing.linear : Easing.bezier(...curve);
    const playback = Animated.timing(value, {
      toValue: 1,
      duration: animation.durationMs ?? 350,
      delay: animation.delayMs ?? 0,
      easing,
      useNativeDriver: true,
    });
    playback.start();
    return () => playback.stop();
  }, [scene, visible, animation, reduceMotion, value]);
  const xml = useMemo(
    () => renderSceneElementSvg(scene, element, { imagePolicy }),
    [scene, element, imagePolicy],
  );
  const frame = element.frame,
    effect = animation?.effect;
  const initial = getEntranceInitialFrame(effect ?? "fade");
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: frame.x * scale,
        top: frame.y * scale,
        width: frame.width * scale,
        height: frame.height * scale,
        transform: [{ rotate: `${frame.rotation ?? 0}deg` }],
      }}
    >
      <Animated.View
        accessibilityElementsHidden={!visible}
        importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
        style={{
          width: "100%",
          height: "100%",
          opacity: value,
          transform: [
            {
              translateX:
                effect === "slide"
                  ? value.interpolate({
                      inputRange: [0, 1],
                      outputRange: [initial.x * scale, 0],
                    })
                  : 0,
            },
            {
              translateY:
                effect === "rise"
                  ? value.interpolate({
                      inputRange: [0, 1],
                      outputRange: [initial.y * scale, 0],
                    })
                  : 0,
            },
            {
              scale:
                effect === "zoom"
                  ? value.interpolate({
                      inputRange: [0, 1],
                      outputRange: [initial.scale, 1],
                    })
                  : 1,
            },
          ],
        }}
      >
        <SvgXml xml={xml} width="100%" height="100%" />
      </Animated.View>
    </View>
  );
}
/** Native scene surface shares the SVG renderer's image policy and resolved geometry; width is measured with onLayout. */
export function NativeSceneSlide({
  scene,
  slide,
  step,
  imagePolicy = "embedded-only",
  reduceMotion,
  style,
}: {
  readonly scene: SlideScene;
  readonly slide: SceneSlide;
  readonly step?: number;
  readonly imagePolicy?: ImageRenderPolicy;
  readonly reduceMotion?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}): ReactNode {
  const [width, setWidth] = useState(0),
    reduced = useReducedMotion(reduceMotion);
  const xml = useMemo(
    () =>
      step === undefined
        ? renderSlideSvg(scene, slide.id, { imagePolicy })
        : "",
    [scene, slide, imagePolicy, step],
  );
  return (
    <View
      accessibilityLabel={slide.title}
      style={[
        styles.surface,
        {
          aspectRatio: scene.size.width / scene.size.height,
          backgroundColor: slide.background,
        },
        style,
      ]}
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        setWidth((current) => (current === next ? current : next));
      }}
    >
      {step === undefined ? (
        <SvgXml xml={xml} width="100%" height="100%" />
      ) : width > 0 ? (
        slide.elements.map((element) => (
          <AnimatedPrimitive
            key={element.id}
            scene={scene}
            element={element}
            scale={width / scene.size.width}
            step={step}
            imagePolicy={imagePolicy}
            reduceMotion={reduced}
          />
        ))
      ) : null}
    </View>
  );
}
/** Native attachment preview owns local navigation, including hidden slides, and defaults to embedded images only. */
export function NativeScenePreview({
  scene,
  title,
  onOpen,
  imagePolicy = "embedded-only",
  style,
}: NativeScenePreviewProps): ReactNode {
  const [position, setPosition] = useState({ scene, index: 0 });
  if (position.scene !== scene) setPosition({ scene, index: 0 });
  const index =
      position.scene === scene
        ? Math.min(position.index, scene.slides.length - 1)
        : 0,
    slide = scene.slides[index];
  return (
    <View style={style}>
      <Text style={styles.caption}>{title ?? scene.title}</Text>
      {onOpen ? <NativeButton label="Open" onPress={onOpen} /> : null}
      {slide ? (
        <NativeSceneSlide
          scene={scene}
          slide={slide}
          imagePolicy={imagePolicy}
        />
      ) : (
        <Text>No slides.</Text>
      )}
      <View style={styles.controls}>
        <NativeButton
          label="Previous"
          disabled={index <= 0}
          onPress={() => setPosition({ scene, index: index - 1 })}
        />
        <Text>
          {slide ? index + 1 : 0} / {scene.slides.length}
        </Text>
        <NativeButton
          label="Next"
          disabled={!slide || index >= scene.slides.length - 1}
          onPress={() => setPosition({ scene, index: index + 1 })}
        />
      </View>
    </View>
  );
}
/** Native presentation playback handles steps, interruption, notes and scene replacement without editing the supplied scene. */
export function NativeScenePlayer({
  scene,
  imagePolicy = "embedded-only",
  style,
  reduceMotion,
}: NativeScenePlayerProps): ReactNode {
  const [navigation, setNavigation] = useState({ scene, index: 0, step: 0 }),
    [notes, setNotes] = useState(false);
  if (navigation.scene !== scene) setNavigation({ scene, index: 0, step: 0 });
  const current =
    navigation.scene === scene ? navigation : { scene, index: 0, step: 0 };
  const slides = scene.slides.filter((slide) => !slide.hidden),
    slide = slides[current.index];
  if (!slide) return <Text>No visible slides.</Text>;
  const max = slide.elements.reduce(
    (value, element) => Math.max(value, element.step ?? 0),
    0,
  );
  return (
    <View style={style}>
      <NativeSceneSlide
        key={slide.id}
        scene={scene}
        slide={slide}
        step={current.step}
        imagePolicy={imagePolicy}
        {...(reduceMotion !== undefined ? { reduceMotion } : {})}
      />
      <View style={styles.controls}>
        <NativeButton
          label="Previous"
          disabled={current.index === 0 && current.step === 0}
          onPress={() =>
            setNavigation({
              ...current,
              ...(current.step > 0
                ? { step: current.step - 1 }
                : { index: current.index - 1, step: 0 }),
            })
          }
        />
        <Text>
          {current.index + 1} / {slides.length} · step {current.step}
        </Text>
        <NativeButton
          label="Next"
          disabled={current.index === slides.length - 1 && current.step >= max}
          onPress={() =>
            setNavigation({
              ...current,
              ...(current.step < max
                ? { step: current.step + 1 }
                : { index: current.index + 1, step: 0 }),
            })
          }
        />
        <NativeButton label="Speaker notes" onPress={() => setNotes(!notes)} />
      </View>
      {notes ? <Text style={styles.caption}>{slide.notes}</Text> : null}
    </View>
  );
}
