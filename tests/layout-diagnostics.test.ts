import { expect, it } from "vitest";
import { createDeck, fromMarkdown } from "@byfungsi/lipat";
import { createAgentTools } from "@byfungsi/lipat/agent";
import { testEngine, unwrap } from "./engine-fixture";
const fonts = [{ family: "Arial", averageWidth: 0.5, lineHeight: 1.2 }];
it("reports text clipping inside an on-slide frame with measured bounds and fixes before export", () => {
  const engine = testEngine();
  const deck = unwrap(
    createDeck(
      {
        id: "clip",
        slides: [
          {
            id: "s",
            content: {
              id: "canvas",
              type: "canvas",
              children: [
                {
                  id: "text",
                  type: "text",
                  text: "One\nTwo\nThree",
                  frame: { x: 20, y: 30, width: 400, height: 30 },
                },
              ],
            },
          },
        ],
      },
      { engine },
    ),
  );
  const result = unwrap(deck.compile({ fonts }));
  const warning = result.diagnostics.find(
    (item) => item.code === "textOverflow",
  );
  expect(warning).toMatchObject({
    slideId: "s",
    nodeId: "text",
    recommendations: ["resizeNode", "reduceFontSize", "splitContent"],
    bounds: {
      kind: "text",
      available: { x: 20, y: 30, width: 400, height: 30 },
    },
  });
  expect(warning?.bounds?.measured.height).toBeCloseTo(86.4);
  expect(warning?.bounds?.overflow.bottom).toBeCloseTo(56.4);
  expect(result.diagnostics.some((item) => item.code === "outsideSlide")).toBe(
    false,
  );
  const exported = unwrap(
    createAgentTools(deck, { engine }).execute("lipat_export", {
      format: "pptx",
    }),
  );
  expect(exported).toMatchObject({
    diagnostics: expect.arrayContaining([
      expect.objectContaining({
        code: "textOverflow",
        bounds: expect.any(Object),
      }),
    ]),
  });
});
it("reports measured stack overflow for unsplit Markdown without treating headings as separators", () => {
  const engine = testEngine();
  const source = "# Report\n\n" + Array(16).fill("Content line").join("\n");
  const input = unwrap(fromMarkdown(source, { id: "overflow" }));
  expect(input.slides).toHaveLength(1);
  const compiled = unwrap(
    unwrap(createDeck(input, { engine })).compile({ fonts }),
  );
  expect(compiled.diagnostics).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "layoutOverflow",
        slideId: "overflow-slide-1",
        nodeId: "overflow-slide-1-body",
        bounds: expect.objectContaining({
          kind: "layout",
          available: expect.objectContaining({ height: 444 }),
        }),
      }),
    ]),
  );
  const warning = compiled.diagnostics.find(
    (item) => item.code === "layoutOverflow",
  );
  expect(warning?.bounds?.measured.height).toBeCloseTo(542.4);
  expect(warning?.bounds?.overflow.bottom).toBeCloseTo(98.4);
});
it("detects a glyph wider than its frame even when the line height fits", () => {
  const deck = unwrap(
    createDeck(
      {
        id: "wide",
        slides: [
          {
            id: "s",
            content: {
              id: "text",
              type: "text",
              text: "W",
              frame: { x: 0, y: 0, width: 4, height: 100 },
            },
          },
        ],
      },
      { engine: testEngine() },
    ),
  );
  const result = unwrap(deck.compile({ fonts }));
  expect(result.diagnostics).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "textOverflow",
        nodeId: "text",
        bounds: expect.objectContaining({
          overflow: expect.objectContaining({ right: 8 }),
        }),
      }),
    ]),
  );
});
it.each(["code", "list"] as const)(
  "measures %s clipping with the same native layout diagnostics",
  (type) => {
    const content =
      type === "code"
        ? {
            id: "node",
            type,
            text: "One\nTwo\nThree",
            frame: { x: 10, y: 10, width: 400, height: 30 },
          }
        : {
            id: "node",
            type,
            items: ["One", "Two", "Three"],
            frame: { x: 10, y: 10, width: 400, height: 30 },
          };
    const deck = unwrap(
      createDeck(
        {
          id: "typed",
          slides: [
            {
              id: "s",
              content: { id: "canvas", type: "canvas", children: [content] },
            },
          ],
        },
        { engine: testEngine() },
      ),
    );
    const result = unwrap(deck.compile({ fonts }));
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "textOverflow",
          nodeId: "node",
          bounds: expect.objectContaining({
            kind: "text",
            available: expect.objectContaining({ height: 30 }),
          }),
        }),
      ]),
    );
  },
);
it("reports grid measurements and detects rotated geometry outside an otherwise fitting frame", () => {
  const engine = testEngine();
  const grid = unwrap(
    createDeck(
      {
        id: "grid",
        slides: [
          {
            id: "s",
            content: {
              id: "grid-node",
              type: "grid",
              columns: 1,
              gap: 0,
              frame: { x: 0, y: 0, width: 100, height: 20 },
              children: [
                { id: "a", type: "text", text: "One" },
                { id: "b", type: "text", text: "Two" },
              ],
            },
          },
        ],
      },
      { engine },
    ),
  );
  const diagnostic = unwrap(grid.compile({ fonts })).diagnostics.find(
    (item) => item.code === "layoutOverflow",
  );
  expect(diagnostic?.bounds?.measured.height).toBeCloseTo(57.6);
  expect(diagnostic?.bounds?.overflow.bottom).toBeCloseTo(37.6);
  const rotated = unwrap(
    createDeck(
      {
        id: "rotated",
        slides: [
          {
            id: "s",
            content: {
              id: "canvas",
              type: "canvas",
              children: [
                {
                  id: "shape",
                  type: "shape",
                  frame: { x: 5, y: 5, width: 100, height: 10, rotation: 90 },
                },
              ],
            },
          },
        ],
      },
      { engine },
    ),
  );
  const outside = unwrap(rotated.compile()).diagnostics.find(
    (item) => item.code === "outsideSlide",
  );
  expect(outside).toMatchObject({
    slideId: "s",
    nodeId: "shape",
    bounds: { kind: "slide" },
    recommendations: ["moveNode", "resizeNode"],
  });
  expect(outside?.bounds?.overflow.top).toBeCloseTo(40);
});
