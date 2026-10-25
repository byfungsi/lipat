import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { createDeck, fromMarkdown } from "@byfungsi/lipat";
import { createAgentTools, deckSchemas } from "@byfungsi/lipat/agent";
import { renderSlideSvg, renderDeckHtml } from "@byfungsi/lipat/render";
import { renderRevealMarkup } from "@byfungsi/lipat/reveal";
import { encodeAssetBytes, decodeAssetBytes } from "@byfungsi/lipat/model";
import { testEngine, testDeck, inputDeck, unwrap } from "./engine-fixture";
const engine = testEngine();
describe("semantic authoring through real WASM", () => {
  it("creates a canonical frozen document and compiles stack/grid intent", () => {
    const deck = testDeck(engine);
    const state = deck.getState();
    expect(state.document.version).toBe(1);
    expect(Object.isFrozen(state.document.slides)).toBe(true);
    const output = unwrap(deck.compile());
    const elements = output.scene.slides[0]?.elements;
    expect(elements?.map((e) => e.id)).toEqual(["title", "left", "right"]);
    expect(elements?.[1]?.frame.x).toBe(48);
    expect(elements?.[2]?.frame.x).toBeGreaterThan(480);
    expect(
      output.diagnostics.some((d) => d.code === "fontMetricsFallback"),
    ).toBe(true);
  });
  it("batches edits atomically, rejects stale revisions and preserves undo/redo", () => {
    const deck = testDeck(engine),
      original = deck.exportDocument();
    let notifications = 0;
    const unsub = deck.subscribe(() => notifications++);
    expect(
      deck.apply(
        [
          { type: "updateText", nodeId: "title", text: "Changed" },
          { type: "updateSlide", slideId: "s1", notes: "Revised notes" },
        ],
        { expectedRevision: 0 },
      ).ok,
    ).toBe(true);
    expect(notifications).toBe(1);
    expect(deck.getState().revision).toBe(1);
    const committed = deck.exportDocument();
    expect(
      deck.apply([
        { type: "updateText", nodeId: "title", text: "Oops" },
        { type: "deleteNode", nodeId: "missing" },
      ]).ok,
    ).toBe(false);
    expect(deck.exportDocument()).toBe(committed);
    expect(deck.apply([], { expectedRevision: 0 })).toMatchObject({
      ok: false,
      error: { reason: "revisionConflict" },
    });
    unwrap(deck.undo());
    expect(deck.exportDocument()).toEqual(original);
    unwrap(deck.redo());
    expect(deck.exportDocument()).toEqual(committed);
    unwrap(deck.undo());
    unwrap(
      deck.apply([{ type: "updateText", nodeId: "title", text: "New branch" }]),
    );
    expect(deck.getState().canRedo).toBe(false);
    unsub();
    deck.dispose();
    expect(deck.apply([])).toMatchObject({
      ok: false,
      error: { reason: "disposed" },
    });
  });
  it("supports insertion, layout changes, moves, styling, frames and slide lifecycle", () => {
    const deck = testDeck(engine);
    unwrap(
      deck.apply([
        {
          type: "insertNode",
          parentId: "columns",
          index: 1,
          node: { id: "new", type: "text", text: "Middle" },
        },
        {
          type: "setLayout",
          nodeId: "columns",
          layout: { type: "row", gap: 10 },
        },
        { type: "moveNode", nodeId: "new", parentId: "columns", index: 0 },
        {
          type: "updateStyle",
          nodeId: "new",
          style: { bold: true, color: "#FF0000" },
        },
        {
          type: "setFrame",
          nodeId: "shape",
          frame: { x: 30, y: 40, width: 200, height: 120 },
        },
        {
          type: "insertSlide",
          index: 2,
          slide: {
            id: "s3",
            content: { id: "body3", type: "stack", children: [] },
          },
        },
        { type: "moveSlide", slideId: "s3", index: 0 },
        { type: "deleteSlide", slideId: "s2" },
      ]),
    );
    expect(deck.inspect().slides.map((s) => s.id)).toEqual(["s3", "s1"]);
    expect(
      deck.inspect().slides[1]?.nodes.find((n) => n.id === "new")?.text,
    ).toBe("Middle");
    expect(
      unwrap(deck.compile()).scene.slides[1]?.elements.find(
        (e) => e.id === "new",
      )?.style.bold,
    ).toBe(true);
    expect(
      deck.apply([
        { type: "moveNode", nodeId: "columns", parentId: "new", index: 0 },
      ]).ok,
    ).toBe(false);
  });
  it("keeps navigation and selection outside document history", () => {
    const deck = testDeck(engine),
      original = deck.exportDocument();
    unwrap(deck.setSelection(["title"]));
    unwrap(deck.setActiveSlide("s2"));
    expect(deck.getState().selection).toEqual([]);
    expect(deck.setSelection(["title"]).ok).toBe(false);
    expect(deck.exportDocument()).toBe(original);
    expect(deck.getState().revision).toBe(0);
    expect(deck.getState().canUndo).toBe(false);
  });
  it("validates IDs, assets, grids, versions, canvas frames and style typos", () => {
    for (const invalid of [
      { ...inputDeck, version: 2 },
      { ...inputDeck, slides: [] },
      {
        id: "bad",
        slides: [
          {
            id: "s",
            content: { id: "x", type: "grid", columns: 0, children: [] },
          },
        ],
      },
      {
        id: "bad",
        slides: [
          {
            id: "s",
            content: {
              id: "x",
              type: "canvas",
              children: [{ id: "c", type: "text", text: "No frame" }],
            },
          },
        ],
      },
      {
        id: "bad",
        slides: [
          { id: "s", content: { id: "x", type: "image", assetId: "missing" } },
        ],
      },
      {
        id: "bad",
        slides: [
          {
            id: "s",
            content: {
              id: "x",
              type: "text",
              text: "Typo",
              style: { fontSze: 42 },
            },
          },
        ],
      },
    ])
      expect(createDeck(invalid, { engine }).ok).toBe(false);
  });
  it("reports exact overflowing nodes and uses explicit font metrics", () => {
    const deck = unwrap(
      createDeck(
        {
          id: "small",
          size: { width: 100, height: 50 },
          slides: [
            {
              id: "s",
              content: {
                id: "canvas",
                type: "canvas",
                children: [
                  {
                    id: "too-big",
                    type: "text",
                    text: "A very long phrase",
                    frame: { x: 80, y: 40, width: 30, height: 4 },
                  },
                ],
              },
            },
          ],
        },
        { engine },
      ),
    );
    const out = unwrap(
      deck.compile({
        fonts: [{ family: "Arial", averageWidth: 0.5, lineHeight: 1.4 }],
      }),
    );
    expect(out.diagnostics.map((d) => [d.code, d.nodeId])).toContainEqual([
      "textOverflow",
      "too-big",
    ]);
    expect(out.diagnostics.map((d) => d.code)).toContain("outsideSlide");
    expect(out.diagnostics.map((d) => d.code)).not.toContain(
      "fontMetricsFallback",
    );
    expect(out.scene.slides[0]?.elements[0]).toMatchObject({
      lineHeight: 33.6,
    });
  });
  it("provides a complete provider-neutral agent tool loop", () => {
    const deck = testDeck(engine),
      tools = createAgentTools(deck, { engine });
    expect(deckSchemas.document.definitions).toBeDefined();
    expect(tools.tools.map((t) => t.name)).toHaveLength(5);
    expect(
      tools.execute("lipat_apply", {
        expectedRevision: 0,
        operations: [
          { type: "updateText", nodeId: "title", text: "Agent authored" },
        ],
      }).ok,
    ).toBe(true);
    expect(
      tools.execute("lipat_apply", { expectedRevision: 0, operations: [] }),
    ).toMatchObject({ ok: false, error: { reason: "revisionConflict" } });
    expect(tools.execute("lipat_compile", {}).ok).toBe(true);
    expect(tools.execute("lipat_preview", { slideId: "s1" })).toMatchObject({
      ok: true,
      value: { mimeType: "image/svg+xml" },
    });
    for (const format of ["pptx", "html", "json"])
      expect(tools.execute("lipat_export", { format }).ok).toBe(true);
    expect(
      tools.execute("lipat_apply", {
        expectedRevision: 1,
        operations: [{ type: "oops" }],
      }).ok,
    ).toBe(false);
  });
  it("authors Markdown slides, vertical sections, notes, tables and code", () => {
    const input = unwrap(
      fromMarkdown(
        "# First\n\n- One\n- Two\nNotes: My notes\n--\n# Detail\n\n```ts\nconst x = 1;\n```\n---\n# Table\n\n| A | B |\n| --- | --- |\n| 1 | 2 |",
        { id: "markdown" },
      ),
    );
    const deck = unwrap(createDeck(input, { engine }));
    expect(deck.exportDocument().slides).toHaveLength(3);
    expect(deck.exportDocument().slides[1]?.parentId).toBe("markdown-slide-1");
    expect(deck.exportDocument().slides[0]?.notes).toBe("My notes");
    const scene = unwrap(deck.compile()).scene;
    expect(renderRevealMarkup(scene)).toContain('class="slides"');
    expect(fromMarkdown("```ts\noops", { id: "bad" }).ok).toBe(false);
  });
  it("escapes rendered content and exposes fragments without executable document markup", () => {
    const deck = testDeck(engine);
    unwrap(
      deck.apply([
        {
          type: "updateText",
          nodeId: "title",
          text: '<script>alert("x")</script>',
        },
      ]),
    );
    const scene = unwrap(deck.compile()).scene;
    const svg = renderSlideSvg(scene, "s1");
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
    expect(renderDeckHtml(scene)).toContain('data-step="1"');
    expect(renderRevealMarkup(scene)).toContain('data-fragment-index="0"');
  });
  it("preserves arbitrary Unicode text across JSON validation, edits and undo", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 100 }), (text) => {
        const deck = testDeck(engine),
          before = deck.exportDocument();
        unwrap(deck.apply([{ type: "updateText", nodeId: "title", text }]));
        expect(
          deck
            .inspect({ maxTextLength: 1000 })
            .slides[0]?.nodes.find((n) => n.id === "title")?.text,
        ).toBe(text);
        unwrap(deck.undo());
        expect(deck.exportDocument()).toEqual(before);
        expect(
          engine.parseDocument(JSON.parse(JSON.stringify(before))),
        ).toEqual({ ok: true, value: before });
      }),
      { numRuns: 60 },
    );
  });
  it("round-trips binary asset encodings", () => {
    fc.assert(
      fc.property(fc.uint8Array({ maxLength: 1000 }), (bytes) => {
        expect(decodeAssetBytes(encodeAssetBytes(bytes))).toEqual(bytes);
      }),
    );
  });
});
it("applies theme spacing to containers without explicit gaps", () => {
  const deck = testDeck(engine);
  const before = unwrap(deck.compile()).scene.slides[0]?.elements.find(
    (e) => e.id === "right",
  )?.frame.x;
  unwrap(
    deck.apply([
      { type: "setTheme", theme: { ...deck.exportDocument().theme, gap: 80 } },
    ]),
  );
  const after = unwrap(deck.compile()).scene.slides[0]?.elements.find(
    (e) => e.id === "right",
  )?.frame.x;
  expect(after).toBeGreaterThan(before ?? 0);
});
