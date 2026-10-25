// @vitest-environment jsdom
import { afterEach, it, expect } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  DeckProvider,
  DeckEditor,
  SlideTabs,
  DeckPreview,
  DeckPlayer,
} from "@byfungsi/lipat/react";
import { testDeck, unwrap } from "./engine-fixture";
afterEach(cleanup);
it("renders composable tabs, navigates and cleans subscriptions on unmount", () => {
  const deck = testDeck();
  const view = render(
    <DeckProvider deck={deck}>
      <SlideTabs />
    </DeckProvider>,
  );
  fireEvent.click(screen.getByText("2. Second"));
  expect(deck.getState().activeSlideId).toBe("s2");
  view.unmount();
  expect(
    deck.apply([{ type: "updateSlide", slideId: "s2", title: "Renamed" }]).ok,
  ).toBe(true);
});
it("keeps preview navigation local and supports SSR without a browser", () => {
  const deck = testDeck();
  render(<DeckPreview deck={deck} title="sample.pptx" />);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("2 / 2")).toBeTruthy();
  expect(deck.getState().activeSlideId).toBe("s1");
  expect(deck.getState().revision).toBe(0);
  expect(renderToString(<DeckPreview deck={deck} />)).toContain("<svg");
});
it("read-only editor provides navigation without mutation controls", () => {
  const deck = testDeck();
  render(<DeckEditor deck={deck} readOnly />);
  expect(screen.queryByRole("button", { name: "Select title" })).toBeNull();
  fireEvent.click(screen.getByText("2. Second"));
  expect(deck.getState().activeSlideId).toBe("s2");
  expect(deck.getState().revision).toBe(0);
});
it("plays slides and incremental reveal steps without mutating the deck", () => {
  const deck = testDeck();
  render(<DeckPlayer deck={deck} />);
  expect(document.querySelector('[data-node-id="right"]')).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(document.querySelector('[data-node-id="right"]')).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("2 / 2")).toBeTruthy();
  expect(deck.getState().revision).toBe(0);
});
it("allows keyboard-only selection and nudging through the composable editor", () => {
  const deck = testDeck();
  render(<DeckEditor deck={deck} />);
  const title = screen.getByRole("button", {
    name: "Select title",
  });
  expect(title.tabIndex).toBe(0);
  fireEvent.focus(title);
  expect(deck.getState().selection).toEqual(["title"]);
  fireEvent.keyDown(title, { key: "ArrowRight" });
  expect(deck.getState().canUndo).toBe(true);
  expect(unwrap(deck.compile()).scene.slides[0]?.elements[0]?.frame.x).toBe(49);
});
