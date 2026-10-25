// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMotionPlayback } from "@byfungsi/lipat/motion";
import { DeckPlayer } from "@byfungsi/lipat/react";
import { renderSlideSvg } from "@byfungsi/lipat/render";
import { testDeck, unwrap } from "./engine-fixture";

afterEach(cleanup);

it("plays stable SVG steps in StrictMode with reduced motion and leaves the deck unchanged", () => {
  const deck = testDeck();
  unwrap(
    deck.apply([
      {
        type: "setAnimation",
        nodeId: "right",
        animation: { effect: "zoom", delayMs: 60000 },
      },
    ]),
  );
  const playback = createMotionPlayback({ reducedMotion: "always" });
  const view = render(
    <StrictMode>
      <DeckPlayer deck={deck} playback={playback} />
    </StrictMode>,
  );
  const target = document.querySelector<SVGElement>(
    '[data-playback-id="right"]',
  );
  expect(target?.style.visibility).toBe("hidden");
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(target?.style.visibility).toBe("visible");
  expect(target?.style.opacity).toBe("1");
  expect(target?.style.transform).toBe("none");
  fireEvent.click(screen.getByRole("button", { name: "Previous" }));
  expect(target?.style.visibility).toBe("hidden");
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("2 / 2")).toBeTruthy();
  expect(deck.getState().revision).toBe(1);
  view.unmount();
});

it("scopes vanilla playback to its surface and restores owned styles on idempotent cleanup", () => {
  const deck = testDeck();
  const scene = unwrap(deck.compile()).scene;
  const slide = scene.slides[0];
  if (!slide) throw new Error("Test slide missing");
  const surface = document.createElement("div");
  surface.innerHTML = renderSlideSvg(scene, slide.id);
  const other = document.createElement("div");
  other.innerHTML = surface.innerHTML;
  document.body.append(surface, other);
  const controller = createMotionPlayback({ reducedMotion: "always" }).mount(
    surface,
    slide,
  );
  controller.setStep(0);
  expect(
    surface
      .querySelector('[data-playback-id="right"]')
      ?.getAttribute("aria-hidden"),
  ).toBe("true");
  expect(other.textContent).toBe(surface.textContent);
  expect(
    other
      .querySelector('[data-playback-id="right"]')
      ?.getAttribute("aria-hidden"),
  ).toBeNull();
  controller.destroy();
  controller.destroy();
  controller.setStep(1);
  expect(
    surface.querySelector('[data-playback-id="right"]')?.getAttribute("style"),
  ).toBeNull();
  surface.remove();
  other.remove();
});
