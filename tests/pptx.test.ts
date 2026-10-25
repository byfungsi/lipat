import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parsePptx, writePptx, createDeck } from "@byfungsi/lipat";
import { testEngine, testDeck, unwrap } from "./engine-fixture";
const engine = testEngine();
describe("independent PPTX byte adapter", () => {
  it("parses an independently generated presentation, relationships, runs, notes, tables and images", () => {
    const imported = unwrap(
      parsePptx(
        new Uint8Array(readFileSync("tests/fixtures/python-pptx.pptx")),
        { engine },
      ),
    );
    expect(imported.scene.slides).toHaveLength(2);
    expect(imported.scene.title).toBe("Independent fixture");
    const slide = imported.scene.slides[0];
    expect(slide?.notes).toBe("These notes come from python-pptx.");
    const text = slide?.elements.find(
      (e) => e.type === "text" && e.text.startsWith("Hello"),
    );
    expect(text).toMatchObject({
      type: "text",
      text: "Hello 世界 & Lipat",
      frame: { x: 72, y: 50.4 },
      runs: [
        { text: "Hello ", style: { bold: true } },
        { text: "世界 & Lipat", style: { italic: true } },
      ],
    });
    expect(
      slide?.elements.some(
        (e) => e.type === "table" && e.columns[0] === "Metric",
      ),
    ).toBe(true);
    expect(imported.scene.assets[0]?.mimeType).toBe("image/png");
    expect(imported.diagnostics.some((d) => d.code === "flattenedGroup")).toBe(
      true,
    );
    expect(
      imported.scene.slides[1]?.elements
        .filter((e) => e.type === "text")
        .map((e) => (e.type === "text" ? e.text : ""))
        .join("\n"),
    ).not.toContain("Click to edit");
  });
  it("keeps parsing separate and explicitly converts imported geometry into editable canvas source", () => {
    const parsed = unwrap(
      engine.parsePptx(
        new Uint8Array(readFileSync("tests/fixtures/python-pptx.pptx")),
      ),
    );
    const document = unwrap(engine.importScene(parsed.scene));
    expect(document.slides[0]?.content.type).toBe("canvas");
    const deck = unwrap(createDeck(document, { engine }));
    const node = deck.inspect().slides[0]?.nodes.find((n) => n.type === "text");
    expect(node).toBeDefined();
    unwrap(
      deck.apply([
        {
          type: "updateText",
          nodeId: node?.id ?? "",
          text: "Edited after import",
        },
      ]),
    );
    expect(
      unwrap(deck.compile()).scene.slides[0]?.elements.some(
        (e) => e.type === "text" && e.text === "Edited after import",
      ),
    ).toBe(true);
  });
  it("exports and reparses resolved scenes, preserving supported content and geometry", () => {
    const deck = testDeck(engine),
      scene = unwrap(deck.compile()).scene;
    const exported = unwrap(writePptx(scene, { engine }));
    expect(exported.bytes.slice(0, 2)).toEqual(Uint8Array.from([80, 75]));
    expect(
      exported.diagnostics.some((d) => d.code === "unsupportedFragmentExport"),
    ).toBe(false);
    const imported = unwrap(parsePptx(exported.bytes, { engine }));
    expect(imported.scene.slides.map((s) => s.title)).toEqual([
      "First",
      "Second",
    ]);
    expect(imported.scene.slides[0]?.notes).toBe("Speaker notes");
    expect(
      imported.scene.slides[0]?.elements.find((e) => e.type === "text"),
    ).toMatchObject({ text: "Hello Lipat", frame: { x: 48, y: 48 } });
    expect(imported.scene.slides[1]?.elements[0]).toMatchObject({
      type: "shape",
      geometry: "ellipse",
      fill: "#5B5BD6",
    });
  });
  it("rejects malformed, oversized and invalid snapshot input without throwing", () => {
    expect(engine.parsePptx(Uint8Array.from([1, 2, 3]))).toMatchObject({
      ok: false,
      error: { reason: "invalidPptx" },
    });
    expect(
      engine.parsePptx(new Uint8Array(32 * 1024 * 1024 + 1)),
    ).toMatchObject({ ok: false, error: { reason: "resourceLimit" } });
    expect(
      engine.parseDocument({ version: 1, id: "x", slides: [] }),
    ).toMatchObject({ ok: false, error: { reason: "invalidDocument" } });
  });
});
it("rejects inconsistent scene text and preserves compiled line wrapping and deck title on export", () => {
  const deck = testDeck(engine);
  unwrap(
    deck.apply([
      {
        type: "setFrame",
        nodeId: "title",
        frame: { x: 0, y: 0, width: 160, height: 140 },
      },
    ]),
  );
  const scene = unwrap(deck.compile()).scene;
  const title = scene.slides[0]?.elements[0];
  expect(title?.type).toBe("text");
  const output = unwrap(engine.writePptx(scene));
  const parsed = unwrap(engine.parsePptx(output.bytes));
  expect(parsed.scene.title).toBe(scene.title);
  if (title?.type === "text")
    expect(
      parsed.scene.slides[0]?.elements.find((e) => e.type === "text"),
    ).toMatchObject({ text: title.lines.join("\n") });
  const invalid = {
    ...scene,
    slides: scene.slides.map((slide, i) =>
      i === 0
        ? {
            ...slide,
            elements: slide.elements.map((e, j) =>
              j === 0
                ? {
                    ...e,
                    type: "text" as const,
                    text: "世界",
                    runs: [],
                    lines: ["x", "y"],
                    lineHeight: 24,
                  }
                : e,
            ),
          }
        : slide,
    ),
  };
  expect(engine.writePptx(invalid)).toMatchObject({
    ok: false,
    error: { reason: "invalidScene" },
  });
});
it("resolves contain placement and exports cover cropping for embedded images", () => {
  const imported = unwrap(
    engine.parsePptx(
      new Uint8Array(readFileSync("tests/fixtures/python-pptx.pptx")),
    ),
  );
  const asset = imported.scene.assets[0];
  if (!asset) throw new Error("Independent image fixture missing");
  const deck = unwrap(
    createDeck(
      {
        id: "images",
        assets: [asset],
        slides: [
          {
            id: "image-slide",
            content: {
              id: "image-canvas",
              type: "canvas",
              children: [
                {
                  id: "contain",
                  type: "image",
                  assetId: asset.id,
                  fit: "contain",
                  frame: { x: 0, y: 0, width: 100, height: 100 },
                },
                {
                  id: "cover",
                  type: "image",
                  assetId: asset.id,
                  fit: "cover",
                  frame: { x: 200, y: 0, width: 100, height: 100 },
                },
              ],
            },
          },
        ],
      },
      { engine },
    ),
  );
  const scene = unwrap(deck.compile()).scene;
  expect(scene.slides[0]?.elements[0]).toMatchObject({
    frame: { x: 0, y: 25, width: 100, height: 50 },
    fit: "stretch",
  });
  const exported = unwrap(engine.writePptx(scene));
  expect(exported.diagnostics).toEqual([]);
  const parsed = unwrap(engine.parsePptx(exported.bytes));
  expect(parsed.scene.slides[0]?.elements[1]).toMatchObject({
    type: "image",
    fit: "cover",
  });
});
