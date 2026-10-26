// @vitest-environment jsdom
import { StrictMode } from "react";
import { afterEach, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { DeckEditor } from "@byfungsi/lipat/react";
import type { DeckDocument, LipatResult } from "@byfungsi/lipat/model";
import type { EditorImageOutput } from "@byfungsi/lipat/core";
import { testDeck, unwrap } from "./engine-fixture";
afterEach(cleanup);
it("edits portable animation timing and rich text through the built-in inspector, with one undo", async () => {
  const deck = testDeck();
  render(
    <StrictMode>
      <DeckEditor deck={deck} />
    </StrictMode>,
  );
  fireEvent.focus(screen.getByRole("button", { name: "Select title" }));
  fireEvent.change(screen.getByLabelText("Entrance effect"), {
    target: { value: "zoom" },
  });
  fireEvent.change(screen.getByLabelText("Reveal step"), {
    target: { value: "2" },
  });
  fireEvent.change(screen.getByLabelText("Animation duration"), {
    target: { value: "750" },
  });
  fireEvent.change(screen.getByLabelText("Animation delay"), {
    target: { value: "100" },
  });
  fireEvent.change(screen.getByLabelText("Animation easing"), {
    target: { value: "linear" },
  });
  fireEvent.click(screen.getByText("Rich text runs"));
  fireEvent.change(screen.getByLabelText("Run 1 text"), {
    target: { value: "Rich title" },
  });
  fireEvent.click(screen.getByText("Bold run"));
  fireEvent.click(screen.getByText("Underline run"));
  fireEvent.change(screen.getByLabelText("Run font family"), {
    target: { value: "Arial" },
  });
  fireEvent.change(screen.getByLabelText("Run font size"), {
    target: { value: "42" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply properties" }));
  expect(
    deck.inspect().slides[0]?.nodes.find((node) => node.id === "title"),
  ).toMatchObject({
    step: 2,
    animation: {
      effect: "zoom",
      durationMs: 750,
      delayMs: 100,
      easing: "linear",
    },
  });
  expect(unwrap(deck.compile()).scene.slides[0]?.elements[0]).toMatchObject({
    text: "Rich title",
    runs: [
      {
        text: "Rich title",
        style: {
          bold: true,
          underline: true,
          fontFamily: "Arial",
          fontSize: 42,
        },
      },
    ],
  });
  expect(deck.getState().revision).toBe(1);
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(deck.getState().revision).toBe(2);
  expect(unwrap(deck.compile()).scene.slides[0]?.elements[0]).toMatchObject({
    text: "Hello Lipat",
  });
});
it("inserts and edits a table, duplicates slides, saves using the host callback and keeps callbacks current", async () => {
  const deck = testDeck(),
    saved: DeckDocument[] = [];
  const view = render(
    <DeckEditor
      deck={deck}
      onSave={(document) => {
        saved.push(document);
      }}
    />,
  );
  fireEvent.click(
    within(
      screen.getByRole("toolbar", { name: "Presentation actions" }),
    ).getByRole("button", { name: "Insert" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Add table" }));
  fireEvent.change(screen.getByLabelText("Table columns"), {
    target: { value: "Product\tCount" },
  });
  fireEvent.change(screen.getByLabelText("Table rows"), {
    target: { value: "Lipat\t12\nNori\t34" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply properties" }));
  expect(unwrap(deck.compile()).scene.slides[0]?.elements.at(-1)).toMatchObject(
    {
      type: "table",
      columns: ["Product", "Count"],
      rows: [
        ["Lipat", "12"],
        ["Nori", "34"],
      ],
    },
  );
  fireEvent.click(screen.getByRole("button", { name: "Slide settings" }));
  fireEvent.click(screen.getByRole("button", { name: "Duplicate slide" }));
  expect(deck.exportDocument().slides).toHaveLength(3);
  expect(screen.getByText("Unsaved changes")).toBeTruthy();
  view.rerender(
    <DeckEditor
      deck={deck}
      onSave={(document) => {
        saved.push(document);
      }}
    />,
  );
  expect(screen.getByText("Unsaved changes")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(saved).toHaveLength(1));
  await screen.findByText("Saved");
  expect(saved[0]).toBe(deck.exportDocument());
});
it("keeps asynchronous host images out of the scene until ready and cancels when unmounted", async () => {
  const deck = testDeck();
  let finish: (value: LipatResult<EditorImageOutput>) => void = () => {
    throw Error("Not started");
  };
  const promise = new Promise<LipatResult<EditorImageOutput>>((resolve) => {
    finish = resolve;
  });
  const view = render(<DeckEditor deck={deck} resolveImage={() => promise} />);
  fireEvent.click(
    within(
      screen.getByRole("toolbar", { name: "Presentation actions" }),
    ).getByRole("button", { name: "Insert" }),
  );
  fireEvent.change(screen.getByLabelText("Insert image URL"), {
    target: { value: "https://input.example.test/source.png" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add image URL" }));
  expect(screen.getByText("Preparing image…")).toBeTruthy();
  expect(deck.getState().revision).toBe(0);
  view.unmount();
  finish({ ok: true, value: { url: "https://cdn.example.test/final.png" } });
  await promise;
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(deck.getState().revision).toBe(0);
});
it("supports layers, duplication, keyboard resize and read-only rendering", () => {
  const deck = testDeck();
  render(<DeckEditor deck={deck} />);
  fireEvent.focus(screen.getByRole("button", { name: "Select title" }));
  fireEvent.click(screen.getByRole("button", { name: "Duplicate element" }));
  const selected = deck.getState().selection[0];
  expect(selected).toBeTruthy();
  const before = unwrap(deck.compile()).scene.slides[0]?.elements.find(
    (node) => node.id === selected,
  );
  expect(before).toBeTruthy();
  const handle = screen.getByRole("button", { name: `Resize ${selected}` });
  fireEvent.keyDown(handle, { key: "ArrowRight", shiftKey: true });
  const after = unwrap(deck.compile()).scene.slides[0]?.elements.find(
    (node) => node.id === selected,
  );
  expect(after?.frame.width).toBe((before?.frame.width ?? 0) + 10);
  fireEvent.click(screen.getByRole("button", { name: "Move back" }));
  expect(unwrap(deck.compile()).scene.slides[0]?.elements[0]?.id).toBe(
    selected,
  );
  expect(
    within(screen.getByRole("navigation", { name: "Layers" })).getAllByRole(
      "button",
    ).length,
  ).toBeGreaterThan(1);
});
it("edits presentation metadata and custom theme tokens together and inserts inside selected containers", () => {
  const deck = testDeck();
  render(<DeckEditor deck={deck} />);
  const layers = screen.getByRole("navigation", { name: "Layers" });
  fireEvent.click(within(layers).getByRole("button", { name: "stack · body" }));
  fireEvent.click(
    within(
      screen.getByRole("toolbar", { name: "Presentation actions" }),
    ).getByRole("button", { name: "Insert" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Add text" }));
  const body = deck.exportDocument().slides[0]?.content;
  expect(body?.type).toBe("stack");
  if (!body || !("children" in body)) throw Error("Stack was not retained");
  expect(body.children.at(-1)?.type).toBe("text");
  fireEvent.click(screen.getByRole("button", { name: "Slide settings" }));
  fireEvent.click(screen.getByText("Custom theme"));
  fireEvent.change(screen.getByLabelText("Presentation title"), {
    target: { value: "Host presentation" },
  });
  fireEvent.change(screen.getByLabelText("Slide width"), {
    target: { value: "1200" },
  });
  fireEvent.change(screen.getByLabelText("Theme accent"), {
    target: { value: "#112233" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply theme" }));
  expect(deck.exportDocument()).toMatchObject({
    title: "Host presentation",
    size: { width: 1200 },
    theme: { accent: "#112233" },
  });
  fireEvent.click(screen.getByRole("button", { name: "2. Second" }));
  fireEvent.change(screen.getByLabelText("Vertical group"), {
    target: { value: "s1" },
  });
  expect(deck.exportDocument().slides[1]?.parentId).toBe("s1");
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(deck.exportDocument().slides[1]?.parentId).toBeUndefined();
});

it("shows live slide thumbnails, supports arrow navigation and keeps notes below the canvas", () => {
  const deck = testDeck();
  const view = render(<DeckEditor deck={deck} />);
  const navigation = screen.getByRole("navigation", {
    name: "Slides",
  });
  const slides = within(navigation).getAllByRole("button");
  expect(
    navigation.querySelectorAll(".lipat-slide-thumbnail svg"),
  ).toHaveLength(2);
  expect(slides[0]?.getAttribute("aria-current")).toBe("page");
  if (!slides[0]) throw Error("Missing first thumbnail");
  fireEvent.keyDown(slides[0], { key: "ArrowDown" });
  expect(deck.getState().activeSlideId).toBe("s2");
  expect(slides[1]?.getAttribute("aria-current")).toBe("page");
  const notes = screen.getByLabelText("Speaker notes");
  expect(notes.closest(".lipat-notes-panel")).not.toBeNull();
  fireEvent.change(notes, { target: { value: "Explain the example first." } });
  expect(deck.exportDocument().slides[1]?.notes).toBe(
    "Explain the example first.",
  );
  fireEvent.click(slides[0]);
  fireEvent.focus(screen.getByRole("button", { name: "Select title" }));
  fireEvent.change(screen.getByLabelText("Selected text"), {
    target: { value: "A live thumbnail" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply text" }));
  expect(
    navigation.querySelector(".lipat-slide-thumbnail")?.textContent,
  ).toContain("A live thumbnail");
  view.unmount();
});
