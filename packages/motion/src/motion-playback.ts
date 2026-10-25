import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";
import type {
  EntranceAnimation,
  SlidePlaybackDriver,
} from "@lipat-internal/model";

/** Reduced motion follows the OS by default; an explicit policy supports kiosk/test hosts. */
export interface MotionPlaybackOptions {
  readonly reducedMotion?: "user" | "always" | "never";
}

function entranceTransform(effect: EntranceAnimation["effect"]): string {
  switch (effect) {
    case "fade":
      return "none";
    case "rise":
      return "translateY(24px)";
    case "slide":
      return "translateX(-32px)";
    case "zoom":
      return "scale(0.95)";
  }
}

/** Optional browser animation adapter; importing it never mounts a player or reads the DOM. */
export function createMotionPlayback(
  options: MotionPlaybackOptions = {},
): SlidePlaybackDriver<HTMLElement> {
  return {
    mount(surface, slide) {
      // Use direct elements, not interpolated selectors: arbitrary document IDs remain safe.
      const targets = new Map(
        [...surface.querySelectorAll<SVGElement>("[data-playback-id]")].map(
          (element) =>
            [element.getAttribute("data-playback-id"), element] as const,
        ),
      );
      const running = new Map<string, AnimationPlaybackControls>();
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
      const policy = options.reducedMotion ?? "user";
      const media =
        policy === "user"
          ? surface.ownerDocument.defaultView?.matchMedia?.(
              "(prefers-reduced-motion: reduce)",
            )
          : undefined;
      const reduced = () =>
        policy === "always" || (policy === "user" && media?.matches === true);
      let currentStep = -1;
      let destroyed = false;

      const stop = (id: string) => {
        running.get(id)?.cancel();
        running.delete(id);
      };
      const showStep = (step: number, settle = false) => {
        if (destroyed || !Number.isInteger(step) || step < 0) return;
        for (const element of slide.elements) {
          const target = targets.get(element.id);
          if (!target) continue;
          const at = element.step ?? 0;
          const visible = at <= step;
          const wasVisible = at <= currentStep;
          if (currentStep >= 0 && !settle && visible === wasVisible) continue;
          stop(element.id);
          target.style.visibility = visible ? "visible" : "hidden";
          target.setAttribute("aria-hidden", String(!visible));
          target.style.opacity = "1";
          target.style.transform = "none";
          if (!visible || !element.animation || settle || reduced()) continue;
          const animation = element.animation;
          target.style.transformBox = "fill-box";
          target.style.transformOrigin = "center";
          // Static rotation lives on the outer SVG group; Motion owns only this inner group.
          target.style.opacity = "0";
          target.style.transform = entranceTransform(animation.effect);
          const ease =
            animation.easing === "linear"
              ? ("linear" as const)
              : animation.easing === "easeInOut"
                ? ([0.77, 0, 0.175, 1] as const)
                : ([0.23, 1, 0.32, 1] as const);
          running.set(
            element.id,
            animate(
              target,
              { opacity: 1, transform: "none" },
              {
                duration: (animation.durationMs ?? 350) / 1000,
                delay: (animation.delayMs ?? 0) / 1000,
                ease,
              },
            ),
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
          for (const control of running.values()) control.cancel();
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
