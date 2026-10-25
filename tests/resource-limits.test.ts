import { expect, it } from "vitest";
import fc from "fast-check";
import { readFileSync } from "node:fs";
import {
  createLipat,
  createLipatFromModule,
  createDeck,
} from "@byfungsi/lipat";
import type { DeckInput, ResourceLimits } from "@byfungsi/lipat";
import { unwrap } from "./engine-fixture";
const bytes = new Uint8Array(readFileSync("packages/wasm/lipat.wasm"));
const module = new WebAssembly.Module(bytes);
const fixture = new Uint8Array(readFileSync("tests/fixtures/python-pptx.pptx"));
const engine = (limits: ResourceLimits = {}) =>
  unwrap(createLipatFromModule(module, { limits }));
const source = (text = "Hello"): DeckInput => ({
  id: "limited",
  slides: [{ id: "s", content: { id: "text", type: "text", text } }],
});

it("initializes from a precompiled module and retains the byte initializer's configuration", () => {
  const a = engine(),
    b = unwrap(createLipat(bytes, { limits: { maxTextBytes: 4 } }));
  expect(a.parseDocument(source()).ok).toBe(true);
  expect(b.parseDocument(source())).toMatchObject({
    ok: false,
    error: { reason: "resourceLimit" },
  });
  expect(createLipatFromModule({})).toMatchObject({
    ok: false,
    error: { reason: "wasmUnavailable" },
  });
  expect(
    createLipatFromModule(
      new WebAssembly.Module(Uint8Array.from([0, 97, 115, 109, 1, 0, 0, 0])),
    ),
  ).toMatchObject({ ok: false, error: { reason: "wasmUnavailable" } });
});
it("rejects unsupported resource configurations and freezes engine policy independently of caller mutations", () => {
  for (const maxNodes of [-1, 0.5, 100001, NaN, Infinity])
    expect(
      createLipatFromModule(module, { limits: { maxNodes } }),
    ).toMatchObject({ ok: false, error: { reason: "invalidLimits" } });
  const extra = { maxNodes: 2, unexpected: true };
  expect(createLipatFromModule(module, { limits: extra })).toMatchObject({
    ok: false,
    error: { reason: "invalidLimits" },
  });
  const limits = { maxTextBytes: 4 };
  const limited = engine(limits);
  limits.maxTextBytes = 100;
  expect(limited.parseDocument(source())).toMatchObject({
    ok: false,
    error: { reason: "resourceLimit" },
  });
  expect(engine().parseDocument(source()).ok).toBe(true);
});
it("enforces UTF-8 text byte boundaries rather than JavaScript string lengths", () => {
  fc.assert(
    fc.property(
      fc.array(fc.constantFrom("a", "é", "中", "🙂"), {
        minLength: 1,
        maxLength: 40,
      }),
      (characters) => {
        const text = characters.join("");
        const length = new TextEncoder().encode(text).length;
        expect(
          engine({ maxTextBytes: length }).parseDocument(source(text)).ok,
        ).toBe(true);
        expect(
          engine({ maxTextBytes: length - 1 }).parseDocument(source(text)),
        ).toMatchObject({ ok: false, error: { reason: "resourceLimit" } });
      },
    ),
    { numRuns: 20 },
  );
});
it("checks ZIP, XML, slide, asset, primitive and table budgets during real PPTX parsing", () => {
  for (const limits of [
    { maxPptxBytes: fixture.length - 1 },
    { maxExpandedBytes: 64 },
    { maxEntryBytes: 64 },
    { maxEntries: 1 },
    { maxXmlBytes: 64 },
    { maxXmlNodes: 2 },
    { maxSlides: 1 },
    { maxAssetBytes: 0 },
    { maxSceneElements: 1 },
    { maxTableCells: 1 },
    { maxDepth: 0 },
    { maxTextBytes: 2 },
    { maxTextLines: 0 },
  ])
    expect(engine(limits).parsePptx(fixture)).toMatchObject({
      ok: false,
      error: { reason: "resourceLimit" },
    });
  expect(engine({ maxPptxBytes: fixture.length }).parsePptx(fixture).ok).toBe(
    true,
  );
});
it("checks document structure, assets and tables before compilation and preserves atomic rollback", () => {
  const input: DeckInput = {
    id: "d",
    slides: [
      {
        id: "s",
        content: {
          id: "root",
          type: "stack",
          children: [
            { id: "a", type: "text", text: "Hi" },
            { id: "b", type: "text", text: "There" },
          ],
        },
      },
    ],
  };
  expect(engine({ maxNodes: 2 }).parseDocument(input)).toMatchObject({
    ok: false,
    error: { reason: "resourceLimit" },
  });
  expect(engine({ maxDepth: 0 }).parseDocument(input)).toMatchObject({
    ok: false,
    error: { reason: "resourceLimit" },
  });
  const imported = unwrap(engine().parsePptx(fixture));
  const asset = imported.scene.assets[0];
  if (!asset) throw new Error("Independent asset missing");
  expect(
    engine({ maxAssetBytes: 0 }).parseDocument({
      ...source(),
      assets: [asset],
    }),
  ).toMatchObject({ ok: false, error: { reason: "resourceLimit" } });
  const table: DeckInput = {
    id: "t",
    slides: [
      {
        id: "s",
        content: {
          id: "table",
          type: "table",
          columns: ["A", "B"],
          rows: [["1", "2"]],
        },
      },
    ],
  };
  expect(engine({ maxTableCells: 3 }).parseDocument(table)).toMatchObject({
    ok: false,
    error: { reason: "resourceLimit" },
  });
  const limited = engine({ maxTextBytes: 5 });
  const deck = unwrap(createDeck(source(), { engine: limited }));
  expect(
    deck.apply([{ type: "updateText", nodeId: "text", text: "Too expensive" }]),
  ).toMatchObject({ ok: false, error: { reason: "resourceLimit" } });
  expect(deck.getState()).toMatchObject({ revision: 0, canUndo: false });
});
it("stops layout at line, primitive and work budgets and retains a usable engine after rejection", () => {
  const defaultEngine = engine();
  const text = unwrap(defaultEngine.parseDocument(source("A\nB\nC")));
  const lineLimited = engine({ maxTextLines: 2 });
  expect(lineLimited.compile(text)).toMatchObject({
    ok: false,
    error: { reason: "resourceLimit" },
  });
  expect(
    lineLimited.compile(unwrap(lineLimited.parseDocument(source()))).ok,
  ).toBe(true);
  expect(
    engine({ maxLayoutWork: 2 }).compile(
      unwrap(defaultEngine.parseDocument(source())),
    ),
  ).toMatchObject({ ok: false, error: { reason: "resourceLimit" } });
  const input: DeckInput = {
    id: "d",
    slides: [
      {
        id: "s",
        content: {
          id: "r",
          type: "stack",
          children: [
            { id: "a", type: "text", text: "A" },
            { id: "b", type: "text", text: "B" },
          ],
        },
      },
    ],
  };
  const doc = unwrap(defaultEngine.parseDocument(input));
  const limited = engine({ maxSceneElements: 1 });
  expect(limited.compile(doc)).toMatchObject({
    ok: false,
    error: { reason: "resourceLimit" },
  });
  const scene = unwrap(defaultEngine.compile(doc)).scene;
  expect(limited.importScene(scene)).toMatchObject({
    ok: false,
    error: { reason: "resourceLimit" },
  });
  expect(limited.writePptx(scene)).toMatchObject({
    ok: false,
    error: { reason: "resourceLimit" },
  });
});
it("rejects oversized SDK requests before allocating a native request buffer", () => {
  const limited = engine({ maxRequestBytes: 1024 });
  expect(limited.parseDocument(source("x".repeat(2048)))).toMatchObject({
    ok: false,
    error: {
      reason: "resourceLimit",
      message: expect.stringContaining("maxRequestBytes"),
    },
  });
  expect(limited.parseDocument(source()).ok).toBe(true);
});

it("charges intrinsic image decoding once per shared asset within the layout-work budget", () => {
  const asset = unwrap(engine().parsePptx(fixture)).scene.assets[0];
  if (!asset) throw new Error("Independent raster asset missing");
  const input: DeckInput = {
    id: "images",
    assets: [asset],
    slides: [
      {
        id: "s",
        content: {
          id: "canvas",
          type: "canvas",
          children: [0, 1, 2].map((index) => ({
            id: `image-${index}`,
            type: "image",
            assetId: asset.id,
            fit: "contain",
            frame: { x: index * 200, y: 20, width: 100, height: 100 },
          })),
        },
      },
    ],
  };
  const document = unwrap(engine().parseDocument(input));
  expect(
    engine({ maxLayoutWork: asset.data.length - 1 }).compile(document),
  ).toMatchObject({ ok: false, error: { reason: "resourceLimit" } });
  const result = unwrap(
    engine({ maxLayoutWork: asset.data.length + 64 }).compile(document),
  );
  expect(result.scene.slides[0]?.elements).toHaveLength(3);
  expect(
    result.scene.slides[0]?.elements.every(
      (element) => element.frame.height === 50,
    ),
  ).toBe(true);
});

it("bounds inherited font metadata and charges style copies before layout expansion", () => {
  expect(
    engine().parseDocument({
      ...source(),
      theme: {
        ...unwrap(engine().parseDocument(source())).theme,
        fontFamily: "x".repeat(1025),
      },
    }),
  ).toMatchObject({ ok: false, error: { reason: "invalidDocument" } });
  const document = unwrap(
    engine().parseDocument({
      ...source(),
      theme: {
        ...unwrap(engine().parseDocument(source())).theme,
        fontFamily: "x".repeat(128),
      },
    }),
  );
  expect(engine({ maxLayoutWork: 100 }).compile(document)).toMatchObject({
    ok: false,
    error: { reason: "resourceLimit" },
  });
});
