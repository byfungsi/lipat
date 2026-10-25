import { expect, it } from "vitest";
import fc from "fast-check";
import { readFileSync } from "node:fs";
import { createLipat, fromMarkdown, importMarkdown } from "@byfungsi/lipat";
import { testEngine, unwrap } from "./engine-fixture";
const fonts = [{ family: "Arial", averageWidth: 0.5, lineHeight: 1.2 }];
it("imports the pre-export working document with one-slide overflow feedback and source boundaries", () => {
  const engine = testEngine();
  const source = "# Report\n\n" + Array(16).fill("Content line").join("\n");
  const imported = unwrap(
    importMarkdown(source, { id: "report", engine, compileOptions: { fonts } }),
  );
  expect(imported.summary).toEqual({
    slideCount: 1,
    boundaries: [
      {
        slideId: "report-slide-1",
        startLine: 1,
        endLine: 19,
        separatorBefore: { kind: "start" },
      },
    ],
  });
  expect(imported.document.slides).toHaveLength(1);
  expect(imported.scene.slides).toHaveLength(1);
  expect(imported.diagnostics).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "markdownSingleSlideOverflow",
        slideId: "report-slide-1",
        nodeId: "report-slide-1-body",
        recommendations: ["addSlideBreaks", "splitContent"],
        bounds: expect.objectContaining({ kind: "layout" }),
      }),
    ]),
  );
  expect(Object.isFrozen(imported.summary.boundaries)).toBe(true);
  expect(imported.document).toEqual(
    unwrap(
      engine.parseDocument(unwrap(fromMarkdown(source, { id: "report" }))),
    ),
  );
});
it("reports actual horizontal/vertical boundaries and ignores separators in fenced code", () => {
  const source = "# First\n```text\n---\n--\n```\n---\n# Second\n--\n# Detail";
  const imported = unwrap(
    importMarkdown(source, {
      id: "boundaries",
      engine: testEngine(),
      compileOptions: { fonts },
    }),
  );
  expect(imported.summary).toEqual({
    slideCount: 3,
    boundaries: [
      {
        slideId: "boundaries-slide-1",
        startLine: 1,
        endLine: 6,
        separatorBefore: { kind: "start" },
      },
      {
        slideId: "boundaries-slide-2",
        startLine: 7,
        endLine: 8,
        separatorBefore: { kind: "horizontal", line: 6 },
      },
      {
        slideId: "boundaries-slide-3",
        startLine: 9,
        endLine: 10,
        separatorBefore: { kind: "vertical", line: 8 },
      },
    ],
  });
  expect(imported.document.slides[2]?.parentId).toBe("boundaries-slide-2");
  expect(
    imported.diagnostics.some(
      (item) => item.code === "markdownSingleSlideOverflow",
    ),
  ).toBe(false);
  expect(
    unwrap(
      importMarkdown("# First\n## Second heading", {
        id: "headings",
        engine: testEngine(),
      }),
    ).summary.slideCount,
  ).toBe(1);
});
it("does not warn for fitting content and returns parser, validation and layout-limit errors", () => {
  const engine = testEngine();
  expect(
    unwrap(
      importMarkdown("# Short", {
        id: "short",
        engine,
        compileOptions: { fonts },
      }),
    ).diagnostics,
  ).toEqual([]);
  expect(importMarkdown("```ts\noops", { id: "bad", engine })).toMatchObject({
    ok: false,
    error: { reason: "invalidMarkdown" },
  });
  expect(
    importMarkdown("![image](javascript:alert(1))", { id: "bad", engine }),
  ).toMatchObject({ ok: false, error: { reason: "invalidMarkdown" } });
  expect(importMarkdown("# Title", { id: "", engine })).toMatchObject({
    ok: false,
    error: { reason: "invalidDocument" },
  });
  const bytes = new Uint8Array(readFileSync("packages/wasm/lipat.wasm"));
  expect(
    importMarkdown("# Title", {
      id: "limited",
      engine: unwrap(createLipat(bytes, { limits: { maxNodes: 1 } })),
    }),
  ).toMatchObject({ ok: false, error: { reason: "resourceLimit" } });
  expect(
    importMarkdown("# Title", {
      id: "limited",
      engine: unwrap(createLipat(bytes, { limits: { maxLayoutWork: 2 } })),
    }),
  ).toMatchObject({ ok: false, error: { reason: "resourceLimit" } });
});

it("preserves parsing and line boundaries across line endings and trailing newlines", () => {
  const engine = testEngine();
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 6 }),
      fc.constantFrom("\n", "\r\n", "\r"),
      fc.boolean(),
      (count, newline, trailing) => {
        const source =
          Array.from(
            { length: count },
            (_, i) => `# Slide ${i + 1}\n\nBody`,
          ).join("\n---\n") + (trailing ? "\n" : "");
        const imported = unwrap(
          importMarkdown(source.replaceAll("\n", newline), {
            id: "generated",
            engine,
          }),
        );
        expect(imported.summary.slideCount).toBe(count);
        expect(imported.document).toEqual(
          unwrap(
            engine.parseDocument(
              unwrap(fromMarkdown(source, { id: "generated" })),
            ),
          ),
        );
        imported.summary.boundaries.forEach((boundary, index) => {
          expect(boundary.startLine).toBe(1 + index * 4);
          expect(boundary.endLine).toBe(
            boundary.startLine + 3 + (index === count - 1 && trailing ? 1 : 0),
          );
        });
      },
    ),
    { numRuns: 30 },
  );
});
