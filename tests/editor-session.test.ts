import { it, expect } from "vitest";
import fc from "fast-check";
import { readFileSync } from "node:fs";
import { createDeck, createDeckEditorSession } from "@byfungsi/lipat/core";
import type { DeckDocument, LipatResult } from "@byfungsi/lipat/model";
import type {
  EditorImageOutput,
  EditorTaskContext,
} from "@byfungsi/lipat/core";
import { testEngine, unwrap } from "./engine-fixture";
const engine = testEngine();
const input = () => ({
  id: "editor",
  slides: [
    {
      id: "s",
      content: { id: "title", type: "heading", text: "Original title" },
    },
  ],
});
function deferred<T>() {
  let complete: (value: T) => void = () => {
    throw new Error("Deferred promise was not initialized");
  };
  const promise = new Promise<T>((resolve) => {
    complete = resolve;
  });
  return { promise, complete };
}
it("freezes semantic geometry and inserts freeform content as one reversible edit", () => {
  const deck = unwrap(createDeck(input(), { engine }));
  const session = createDeckEditorSession(deck);
  const before = unwrap(deck.compile()).scene.slides[0]?.elements[0];
  unwrap(
    session.insertNode({
      id: session.createNodeId("shape"),
      type: "shape",
      fill: "#FF0000",
      frame: { x: 300, y: 100, width: 90, height: 80 },
    }),
  );
  const after = unwrap(deck.compile()).scene.slides[0]?.elements;
  expect(after?.[0]).toEqual(before);
  expect(after?.[1]?.frame).toMatchObject({
    x: 300,
    y: 100,
    width: 90,
    height: 80,
  });
  expect(deck.getState().revision).toBe(1);
  unwrap(deck.undo());
  expect(deck.exportDocument().slides[0]?.content.type).toBe("heading");
  expect(session.getState().dirty).toBe(false);
  session.dispose();
  deck.dispose();
});
it("saves immutable snapshots, deduplicates submissions and keeps edits during a save dirty", async () => {
  const deck = unwrap(createDeck(input(), { engine })),
    pending = deferred<void>();
  const snapshots: DeckDocument[] = [];
  const session = createDeckEditorSession(deck, {
    onSave: async (document) => {
      snapshots.push(document);
      await pending.promise;
    },
  });
  unwrap(deck.apply([{ type: "updateText", nodeId: "title", text: "First" }]));
  const saving = session.save();
  expect((await session.save()).ok).toBe(false);
  expect(snapshots).toHaveLength(1);
  expect(Object.isFrozen(snapshots[0])).toBe(true);
  unwrap(deck.apply([{ type: "updateText", nodeId: "title", text: "Second" }]));
  pending.complete();
  unwrap(await saving);
  expect(session.getState().dirty).toBe(true);
  unwrap(await session.save());
  expect(session.getState().dirty).toBe(false);
  expect(snapshots).toHaveLength(2);
  session.dispose();
});
it("exposes save failure and retry without falsely marking the document saved", async () => {
  const deck = unwrap(createDeck(input(), { engine }));
  let fail = true;
  const session = createDeckEditorSession(deck, {
    onSave: () => {
      if (fail) throw new Error("private host token");
    },
  });
  unwrap(
    deck.apply([{ type: "updateText", nodeId: "title", text: "Changed" }]),
  );
  expect(await session.save()).toMatchObject({
    ok: false,
    error: { reason: "saveFailed" },
  });
  expect(session.getState().dirty).toBe(true);
  expect(JSON.stringify(session.getState())).not.toContain(
    "private host token",
  );
  fail = false;
  unwrap(await session.save());
  expect(session.getState().dirty).toBe(false);
  session.dispose();
});
it("waits for an arbitrary host upload command before inserting the final URL atomically", async () => {
  const deck = unwrap(createDeck(input(), { engine })),
    pending = deferred<LipatResult<EditorImageOutput>>();
  const contexts: EditorTaskContext[] = [];
  const session = createDeckEditorSession(deck, {
    resolveImage: async (_input, context) => {
      contexts.push(context);
      return pending.promise;
    },
  });
  const adding = session.addImage({
    kind: "uri",
    uri: "file:///host-picker.png",
    name: "Uploaded image",
  });
  expect(deck.getState().revision).toBe(0);
  expect(session.getState().image.status).toBe("pending");
  pending.complete({
    ok: true,
    value: { url: "https://cdn.example.test/final.png" },
  });
  unwrap(await adding);
  expect(deck.getState().revision).toBe(1);
  expect(unwrap(deck.compile()).scene.slides[0]?.elements.at(-1)).toMatchObject(
    {
      type: "image",
      url: "https://cdn.example.test/final.png",
      alt: "Uploaded image",
    },
  );
  expect(contexts[0]?.isCancelled()).toBe(false);
  unwrap(deck.undo());
  expect(deck.exportDocument().slides[0]?.content.type).toBe("heading");
  session.dispose();
});
it("cancels image work and refuses stale slide targets without changing history", async () => {
  const deck = unwrap(createDeck(input(), { engine }));
  let pending = deferred<LipatResult<EditorImageOutput>>();
  const session = createDeckEditorSession(deck, {
    resolveImage: () => pending.promise,
  });
  const first = session.addImage({
    kind: "url",
    url: "https://example.test/first.png",
  });
  session.cancelImage();
  pending.complete({
    ok: true,
    value: { url: "https://example.test/late.png" },
  });
  expect(await first).toMatchObject({
    ok: false,
    error: { reason: "cancelled" },
  });
  expect(deck.getState().revision).toBe(0);
  pending = deferred();
  const second = session.addImage({
    kind: "url",
    url: "https://example.test/second.png",
  });
  unwrap(session.addSlide());
  unwrap(deck.apply([{ type: "deleteSlide", slideId: "s" }]));
  const revision = deck.getState().revision;
  pending.complete({
    ok: true,
    value: { url: "https://example.test/final.png" },
  });
  expect(await second).toMatchObject({
    ok: false,
    error: { reason: "staleTarget" },
  });
  expect(deck.getState().revision).toBe(revision);
  session.dispose();
});
it("validates final image URLs and assets before committing and handles read-only/disposed workflows", async () => {
  const deck = unwrap(createDeck(input(), { engine }));
  const session = createDeckEditorSession(deck, {
    resolveImage: () => ({ ok: true, value: { url: "javascript:bad" } }),
  });
  expect(
    (
      await session.addImage({
        kind: "url",
        url: "https://example.test/input.png",
      })
    ).ok,
  ).toBe(false);
  expect(deck.getState().revision).toBe(0);
  session.dispose();
  expect(await session.save()).toMatchObject({
    ok: false,
    error: { reason: "disposed" },
  });
  const readOnly = createDeckEditorSession(deck, { readOnly: true });
  expect(readOnly.addSlide()).toMatchObject({
    ok: false,
    error: { reason: "readOnly" },
  });
  expect(
    await readOnly.addImage({ kind: "url", url: "https://example.test/a.png" }),
  ).toMatchObject({ ok: false, error: { reason: "readOnly" } });
  readOnly.dispose();
});
it("creates unique copied IDs, preserves slide content, and keeps undo/redo ordering valid", () => {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 12 }), (count) => {
      const deck = unwrap(createDeck(input(), { engine }));
      const session = createDeckEditorSession(deck);
      for (let i = 0; i < count; i++) unwrap(session.duplicateSlide("s"));
      const ids = deck
        .inspect()
        .slides.flatMap((slide) => [
          slide.id,
          ...slide.nodes.map((node) => node.id),
        ]);
      expect(new Set(ids).size).toBe(ids.length);
      expect(deck.exportDocument().slides).toHaveLength(count + 1);
      for (let i = 0; i < count; i++) unwrap(deck.undo());
      expect(deck.exportDocument().slides).toHaveLength(1);
      session.dispose();
      deck.dispose();
    }),
    { numRuns: 15 },
  );
});
it("clears a selected source root as one undoable edit and removes only unshared deleted image assets", async () => {
  const deck = unwrap(createDeck(input(), { engine })),
    session = createDeckEditorSession(deck);
  unwrap(deck.setSelection(["title"]));
  unwrap(session.deleteSelection());
  expect(deck.exportDocument().slides[0]?.content).toMatchObject({
    type: "canvas",
    children: [],
  });
  unwrap(deck.undo());
  expect(deck.exportDocument().slides[0]?.content.type).toBe("heading");
  const bytes = new Uint8Array(
    readFileSync("examples/react-demo/public/images/fold.png"),
  );
  unwrap(
    await session.addImage({
      kind: "bytes",
      mimeType: "image/png",
      name: "Image",
      bytes,
    }),
  );
  expect(deck.exportDocument().assets).toHaveLength(1);
  unwrap(session.deleteSelection());
  expect(deck.exportDocument().assets).toHaveLength(0);
  unwrap(deck.undo());
  expect(deck.exportDocument().assets).toHaveLength(1);
  session.dispose();
});
