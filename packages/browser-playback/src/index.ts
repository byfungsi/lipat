import {
  getEntranceInitialFrame,
  getEntranceEasing,
} from "@lipat-internal/model";
import type {
  EntranceAnimation,
  SlidePlaybackDriver,
} from "@lipat-internal/model";
/** Browser players follow the OS reduced motion setting unless an explicit host policy overrides it. */
export interface BrowserPlaybackOptions {
  readonly reducedMotion?: "user" | "always" | "never";
}
/** An optional SVG transform has explicit matching endpoints so SVG never interpolates from a computed zero matrix. */
export interface SvgEntranceTransforms {
  readonly initial: string;
  readonly rest: string;
}
/** Shared browser lifecycle accepts an animation implementation without depending on React or Motion. */
export type SvgEntranceAnimator = (
  target: SVGElement,
  animation: EntranceAnimation,
  transforms: SvgEntranceTransforms | null,
) => { cancel(): void };
/** Own SVG target lookup, reveal transitions, reduced motion listeners and exact restoration once for all browser animation drivers. */
export function createSvgPlaybackDriver(
  animator: SvgEntranceAnimator,
  options: BrowserPlaybackOptions = {},
): SlidePlaybackDriver<HTMLElement> {
  return {
    mount(surface, slide) {
      const targets = new Map(
        [...surface.querySelectorAll<SVGElement>("[data-playback-id]")].map(
          (element) =>
            [element.getAttribute("data-playback-id"), element] as const,
        ),
      );
      const originals = new Map(
        [...targets.values()].map(
          (element) =>
            [
              element,
              {
                style: element.getAttribute("style"),
                ariaHidden: element.getAttribute("aria-hidden"),
              },
            ] as const,
        ),
      );
      const running = new Map<string, { cancel(): void }>(),
        policy = options.reducedMotion ?? "user";
      const media =
        policy === "user"
          ? surface.ownerDocument.defaultView?.matchMedia?.(
              "(prefers-reduced-motion: reduce)",
            )
          : undefined;
      const reduced = () =>
        policy === "always" || (policy === "user" && media?.matches === true);
      let currentStep = -1,
        destroyed = false;
      const stop = (id: string) => {
        running.get(id)?.cancel();
        running.delete(id);
      };
      const showStep = (step: number, settle = false) => {
        if (destroyed || !Number.isInteger(step) || step < 0) return;
        for (const element of slide.elements) {
          const target = targets.get(element.id);
          if (!target) continue;
          const at = element.step ?? 0,
            visible = at <= step,
            wasVisible = at <= currentStep;
          if (currentStep >= 0 && !settle && visible === wasVisible) continue;
          stop(element.id);
          target.style.visibility = visible ? "visible" : "hidden";
          target.setAttribute("aria-hidden", String(!visible));
          target.style.opacity = "1";
          target.style.transform = "none";
          if (!visible || !element.animation || settle || reduced()) continue;
          target.style.transformBox = "fill-box";
          target.style.transformOrigin = "center";
          target.style.opacity = "0";
          const frame = getEntranceInitialFrame(element.animation.effect);
          const transforms: SvgEntranceTransforms | null =
            frame.x !== 0
              ? { initial: `translateX(${frame.x}px)`, rest: "translateX(0px)" }
              : frame.y !== 0
                ? {
                    initial: `translateY(${frame.y}px)`,
                    rest: "translateY(0px)",
                  }
                : frame.scale !== 1
                  ? { initial: `scale(${frame.scale})`, rest: "scale(1)" }
                  : null;
          target.style.transform = transforms?.initial ?? "none";
          running.set(
            element.id,
            animator(target, element.animation, transforms),
          );
        }
        currentStep = step;
      };
      const onPreferenceChange = () => {
        if (reduced()) showStep(Math.max(0, currentStep), true);
      };
      media?.addEventListener("change", onPreferenceChange);
      return {
        setStep: showStep,
        destroy() {
          if (destroyed) return;
          destroyed = true;
          media?.removeEventListener("change", onPreferenceChange);
          for (const animation of running.values()) animation.cancel();
          running.clear();
          for (const [element, original] of originals) {
            if (original.style === null) element.removeAttribute("style");
            else element.setAttribute("style", original.style);
            if (original.ariaHidden === null)
              element.removeAttribute("aria-hidden");
            else element.setAttribute("aria-hidden", original.ariaHidden);
          }
        },
      };
    },
  };
}
/** Default browser animation uses Web Animations without a Motion dependency; unsupported animation APIs settle immediately. */
export function createBrowserPlayback(
  options: BrowserPlaybackOptions = {},
): SlidePlaybackDriver<HTMLElement> {
  return createSvgPlaybackDriver((target, animation, transforms) => {
    if (typeof target.animate !== "function") {
      target.style.opacity = "1";
      target.style.transform = transforms?.rest ?? "none";
      return { cancel() {} };
    }
    const ease = getEntranceEasing(animation.easing);
    return target.animate(
      [
        {
          opacity: 0,
          ...(transforms ? { transform: transforms.initial } : {}),
        },
        { opacity: 1, ...(transforms ? { transform: transforms.rest } : {}) },
      ],
      {
        duration: animation.durationMs ?? 350,
        delay: animation.delayMs ?? 0,
        easing: ease === "linear" ? ease : `cubic-bezier(${ease.join(",")})`,
        fill: "both",
      },
    );
  }, options);
}
