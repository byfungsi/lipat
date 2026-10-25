import { useMemo, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { DeckRuntime } from "@lipat-internal/core";
import { renderSlideSvg } from "@lipat-internal/render";
/** Read-only attachment preview owns local navigation and never changes runtime selection. */
export function DeckPreview({
  deck,
  title,
  theme = "light",
  onOpen,
}: {
  readonly deck: DeckRuntime;
  readonly title?: string;
  readonly theme?: "light" | "dark";
  readonly onOpen?: () => void;
}): ReactNode {
  const state = useSyncExternalStore(
    deck.subscribe,
    deck.getState,
    deck.getState,
  );
  const compiled = useMemo(() => deck.compile(), [deck, state.document]);
  const [index, setIndex] = useState(0);
  if (!compiled.ok) return <p role="alert">{compiled.error.message}</p>;
  const scene = compiled.value.scene;
  const current = Math.min(index, scene.slides.length - 1),
    slide = scene.slides[current];
  return (
    <article className="lipat-preview" data-theme={theme}>
      <header>
        {title ?? scene.title}
        {onOpen ? <button onClick={onOpen}>Open</button> : null}
      </header>
      {slide ? (
        <div
          dangerouslySetInnerHTML={{ __html: renderSlideSvg(scene, slide.id) }}
        />
      ) : null}
      <nav aria-label="Preview slides">
        <button disabled={current === 0} onClick={() => setIndex(current - 1)}>
          Previous
        </button>
        <span>
          {current + 1} / {scene.slides.length}
        </span>
        <button
          disabled={current === scene.slides.length - 1}
          onClick={() => setIndex(current + 1)}
        >
          Next
        </button>
      </nav>
    </article>
  );
}
/** Browser player handles incremental steps separately from the authoring document. */
export function DeckPlayer({
  deck,
}: {
  readonly deck: DeckRuntime;
}): ReactNode {
  const state = useSyncExternalStore(
    deck.subscribe,
    deck.getState,
    deck.getState,
  );
  const compiled = useMemo(() => deck.compile(), [deck, state.document]);
  const [index, setIndex] = useState(0),
    [step, setStep] = useState(0);
  if (!compiled.ok) return <p role="alert">{compiled.error.message}</p>;
  const scene = compiled.value.scene,
    slides = scene.slides.filter((s) => !s.hidden),
    current = Math.min(index, slides.length - 1),
    slide = slides[current];
  if (!slide) return <p>No visible slides.</p>;
  const max = Math.max(0, ...slide.elements.map((e) => e.step ?? 0));
  const next = () => {
    if (step < max) setStep(step + 1);
    else if (current < slides.length - 1) {
      setIndex(current + 1);
      setStep(0);
    }
  };
  const previous = () => {
    if (step > 0) setStep(step - 1);
    else if (current > 0) {
      setIndex(current - 1);
      setStep(0);
    }
  };
  return (
    <div
      className="lipat-player"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === " ") {
          e.preventDefault();
          next();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          previous();
        }
      }}
    >
      <div
        dangerouslySetInnerHTML={{
          __html: renderSlideSvg(scene, slide.id, { step }),
        }}
      />
      <nav>
        <button onClick={previous}>Previous</button>
        <span>
          {current + 1} / {slides.length}
        </span>
        <button onClick={next}>Next</button>
      </nav>
      <details>
        <summary>Speaker notes</summary>
        {slide.notes}
      </details>
    </div>
  );
}
