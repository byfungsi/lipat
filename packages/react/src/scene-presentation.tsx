import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { renderSlideSvg } from "@lipat-internal/render";
import type { ImageRenderPolicy } from "@lipat-internal/render";
import type {
  SceneSlide,
  SlideScene,
  SlidePlaybackDriver,
  SlidePlaybackController,
} from "@lipat-internal/model";

/** Scene-only preview needs no authoring runtime or WASM; remote images are omitted by default. */
export interface ScenePreviewProps {
  readonly scene: SlideScene;
  readonly title?: string;
  readonly theme?: "light" | "dark";
  readonly onOpen?: () => void;
  readonly imagePolicy?: ImageRenderPolicy;
}
/** Scene-only player supports optional browser playback and defaults to embedded raster images only. */
export interface ScenePlayerProps {
  readonly scene: SlideScene;
  readonly playback?: SlidePlaybackDriver<HTMLElement>;
  readonly imagePolicy?: ImageRenderPolicy;
}
function useSceneNavigation(scene: SlideScene) {
  const [navigation, setNavigation] = useState({ scene, index: 0, step: 0 });
  // Immutable scene replacement resets before paint, so old reveal state cannot leak into a new artifact.
  const current =
    navigation.scene === scene ? navigation : { scene, index: 0, step: 0 };
  if (navigation.scene !== scene) setNavigation(current);
  return [current, setNavigation] as const;
}
function AnimatedSceneSlide({
  scene,
  slide,
  step,
  playback,
  imagePolicy,
}: {
  readonly scene: SlideScene;
  readonly slide: SceneSlide;
  readonly step: number;
  readonly playback: SlidePlaybackDriver<HTMLElement>;
  readonly imagePolicy: ImageRenderPolicy;
}): ReactNode {
  const root = useRef<HTMLDivElement>(null);
  const controller = useRef<SlidePlaybackController | null>(null);
  const markup = useMemo(
    () =>
      renderSlideSvg(scene, slide.id, {
        step: 0,
        retainSteps: true,
        imagePolicy,
      }),
    [scene, slide, imagePolicy],
  );
  useLayoutEffect(() => {
    if (!root.current) return;
    const mounted = playback.mount(root.current, slide);
    controller.current = mounted;
    return () => {
      mounted.destroy();
      controller.current = null;
    };
  }, [playback, slide, markup]);
  useLayoutEffect(() => {
    controller.current?.setStep(step);
  }, [step, playback, slide, markup]);
  return <div ref={root} dangerouslySetInnerHTML={{ __html: markup }} />;
}
/** Render immutable attachment scenes with local navigation and no engine initialization. */
export function ScenePreview({
  scene,
  title,
  theme = "light",
  onOpen,
  imagePolicy = "embedded-only",
}: ScenePreviewProps): ReactNode {
  const [navigation, setNavigation] = useSceneNavigation(scene);
  const current = Math.max(
    0,
    Math.min(navigation.index, scene.slides.length - 1),
  );
  const slide = scene.slides[current];
  return (
    <article className="lipat-preview" data-theme={theme}>
      <header>
        {title ?? scene.title}
        {onOpen ? <button onClick={onOpen}>Open</button> : null}
      </header>
      {slide ? (
        <div
          dangerouslySetInnerHTML={{
            __html: renderSlideSvg(scene, slide.id, { imagePolicy }),
          }}
        />
      ) : (
        <p>No slides.</p>
      )}
      <nav aria-label="Preview slides">
        <button
          disabled={current === 0}
          onClick={() => setNavigation({ scene, index: current - 1, step: 0 })}
        >
          Previous
        </button>
        <span>
          {slide ? current + 1 : 0} / {scene.slides.length}
        </span>
        <button
          disabled={!slide || current === scene.slides.length - 1}
          onClick={() => setNavigation({ scene, index: current + 1, step: 0 })}
        >
          Next
        </button>
      </nav>
    </article>
  );
}
/** Present immutable resolved scenes and reveal steps; playback and navigation never mutate scene data. */
export function ScenePlayer({
  scene,
  playback,
  imagePolicy = "embedded-only",
}: ScenePlayerProps): ReactNode {
  const [navigation, setNavigation] = useSceneNavigation(scene);
  const slides = scene.slides.filter((slide) => !slide.hidden);
  const current = Math.max(0, Math.min(navigation.index, slides.length - 1));
  const slide = slides[current],
    step = navigation.step;
  if (!slide) return <p>No visible slides.</p>;
  const max = slide.elements.reduce(
    (value, element) => Math.max(value, element.step ?? 0),
    0,
  );
  const next = () => {
    if (step < max) setNavigation({ scene, index: current, step: step + 1 });
    else if (current < slides.length - 1)
      setNavigation({ scene, index: current + 1, step: 0 });
  };
  const previous = () => {
    if (step > 0) setNavigation({ scene, index: current, step: step - 1 });
    else if (current > 0) setNavigation({ scene, index: current - 1, step: 0 });
  };
  return (
    <div
      className="lipat-player"
      tabIndex={0}
      onKeyDown={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("button,input,textarea,select,[contenteditable]")
        )
          return;
        if (event.key === "ArrowRight" || event.key === " ") {
          event.preventDefault();
          next();
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          previous();
        }
      }}
    >
      {playback ? (
        <AnimatedSceneSlide
          key={slide.id}
          scene={scene}
          slide={slide}
          step={step}
          playback={playback}
          imagePolicy={imagePolicy}
        />
      ) : (
        <div
          dangerouslySetInnerHTML={{
            __html: renderSlideSvg(scene, slide.id, { step, imagePolicy }),
          }}
        />
      )}
      <nav>
        <button disabled={current === 0 && step === 0} onClick={previous}>
          Previous
        </button>
        <span>
          {current + 1} / {slides.length}
        </span>
        <button
          disabled={current === slides.length - 1 && step >= max}
          onClick={next}
        >
          Next
        </button>
      </nav>
      <details>
        <summary>Speaker notes</summary>
        {slide.notes}
      </details>
    </div>
  );
}
