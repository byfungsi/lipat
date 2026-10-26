import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createDeck, createLipatFromModule } from "@byfungsi/lipat";
import type { ChartData, DeckInput } from "@byfungsi/lipat";
import { createSvgAsset } from "@byfungsi/lipat/images";
import { renderSlideSvg, renderSceneElementSvg } from "@byfungsi/lipat/render";
import { testEngine, unwrap } from "./engine-fixture";

const engine = testEngine();
const chart: ChartData = {
  kind: "column",
  title: "Revenue & margin",
  categories: ["Q1", "Q2", "Q3", "Q4"],
  series: [
    { name: "Revenue", values: [12, 18, 26, 35], color: "#3568D4" },
    { name: "Costs", values: [9, 11, 14, 18], color: "#16A085" },
  ],
  showValues: true,
};
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><defs><linearGradient id="paint"><stop offset="0" stop-color="#5856D6"/><stop offset="1" stop-color="#16A085"/></linearGradient></defs><rect width="120" height="80" rx="12" fill="url(#paint)"/><text x="12" y="44" fill="#FFFFFF" font-size="16">Lipat &amp; SVG</text></svg>';
const source = (data: ChartData): DeckInput => ({
  id: "charts",
  assets: [createSvgAsset({ id: "vector", svg })],
  slides: [
    {
      id: "s1",
      content: {
        id: "canvas",
        type: "canvas",
        children: [
          {
            id: "chart",
            type: "chart",
            chart: data,
            frame: { x: 40, y: 80, width: 640, height: 400 },
          },
          {
            id: "logo",
            type: "image",
            assetId: "vector",
            frame: { x: 740, y: 100, width: 160, height: 120 },
            alt: "Gradient SVG mark",
          },
        ],
      },
    },
  ],
});

describe("charts and SVG through the real WASM/public interfaces", () => {
  it("preserves SVG intrinsic units and its own aspect-ratio mapping inside an image fit frame", () => {
    const asset = createSvgAsset({
      id: "vector",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1in" height="0.5in" viewBox="0 0 20 20" preserveAspectRatio="xMinYMin meet"><circle cx="10" cy="10" r="8" fill="#123456"/></svg>',
    });
    const doc = unwrap(
      engine.parseDocument({ ...source(chart), assets: [asset] }),
    );
    const compiled = unwrap(engine.compile(doc));
    const image = compiled.scene.slides[0]?.elements.find(
      (e) => e.type === "image",
    );
    expect(image?.frame.height).toBe(80);
    const markup = renderSlideSvg(compiled.scene, "s1");
    expect(markup).toContain('viewBox="0 0 96 48"');
    expect(markup).toContain('preserveAspectRatio="xMinYMin meet"');
    expect(markup).toContain('width="96" height="48"');
  });
  it.each(["0 0 nope 20", "0 0 20", "0 0 -20 20", "0 0 Infinity 20"])(
    "rejects malformed SVG viewBox dimensions: %s",
    (viewBox) => {
      const asset = createSvgAsset({
        id: "vector",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="${viewBox}"><rect width="20" height="20"/></svg>`,
      });
      expect(
        engine.parseDocument({ ...source(chart), assets: [asset] }),
      ).toMatchObject({ ok: false, error: { reason: "invalidSvg" } });
    },
  );
  it("imports six independent python-pptx charts and diagnoses unsupported scatter data", () => {
    const imported = unwrap(
      engine.parsePptx(readFileSync("tests/fixtures/python-charts.pptx")),
    );
    const charts = imported.scene.slides
      .flatMap((s) => s.elements)
      .filter((e) => e.type === "chart");
    expect(charts.map((e) => e.chart.kind)).toEqual([
      "column",
      "bar",
      "line",
      "area",
      "pie",
      "doughnut",
    ]);
    for (const element of charts) {
      expect(element.chart.categories).toEqual([
        "North & East",
        "日本語",
        "South",
      ]);
      expect(element.chart.series[0]?.values).toEqual([12, 24, 36]);
      expect(element.chart.title).toBe("Independent chart");
    }
    expect(
      imported.diagnostics.some((d) => d.code === "unsupportedChart"),
    ).toBe(true);
  });
  it("uses a conventional raster fallback when an imported SVG is outside the static profile", () => {
    const imported = unwrap(
      engine.parsePptx(readFileSync("tests/fixtures/svg-raster-fallback.pptx")),
    );
    expect(
      imported.scene.assets.some((a) => a.mimeType === "image/svg+xml"),
    ).toBe(false);
    expect(imported.scene.assets.some((a) => a.mimeType === "image/png")).toBe(
      true,
    );
    expect(
      imported.diagnostics.some((d) => d.code === "svgRasterFallback"),
    ).toBe(true);
  });
  it.each(["column", "bar", "line", "area", "pie", "doughnut"] as const)(
    "compiles, renders, edits and round-trips a native %s chart with SVG assets",
    (kind) => {
      const circular = kind === "pie" || kind === "doughnut";
      const data = {
        ...chart,
        kind,
        series: circular ? chart.series.slice(0, 1) : chart.series,
      };
      const deck = unwrap(createDeck(source(data), { engine }));
      const scene = unwrap(deck.compile()).scene;
      const markup = renderSlideSvg(scene, "s1", {
        imagePolicy: "embedded-only",
      });
      expect(markup).toContain('role="img"');
      expect(markup).toContain("Revenue &amp; margin");
      expect(markup).toContain("linearGradient");
      expect(markup).not.toContain('id="paint"');
      expect(markup).not.toContain("http://example");
      const logo = scene.slides[0]?.elements.find((e) => e.id === "logo");
      expect(logo).toBeDefined();
      if (logo)
        expect(
          renderSceneElementSvg(scene, logo, { imagePolicy: "embedded-only" }),
        ).toContain("linearGradient");
      const output = unwrap(engine.writePptx(scene));
      const parsed = unwrap(engine.parsePptx(output.bytes));
      const result = parsed.scene.slides[0]?.elements.find(
        (e) => e.type === "chart",
      );
      expect(result?.type).toBe("chart");
      if (result?.type === "chart") {
        expect(result.chart).toMatchObject({
          kind,
          categories: chart.categories,
          series: data.series,
          title: chart.title,
          showValues: true,
        });
      }
      expect(
        parsed.scene.assets.some((a) => a.mimeType === "image/svg+xml"),
      ).toBe(true);
      const lifted = unwrap(engine.importScene(parsed.scene));
      const editable = unwrap(createDeck(lifted, { engine }));
      if (!result) throw Error("Native chart was omitted");
      unwrap(
        editable.apply([
          {
            type: "setChartData",
            nodeId: result.id,
            chart: { ...data, title: "Edited chart" },
          },
        ]),
      );
      expect(JSON.stringify(editable.exportDocument())).toContain(
        "Edited chart",
      );
      expect(editable.undo().ok).toBe(true);
      unwrap(
        deck.apply([
          {
            type: "setChartData",
            nodeId: "chart",
            chart: { ...data, title: "Updated chart" },
          },
        ]),
      );
      expect(JSON.stringify(deck.exportDocument())).toContain("Updated chart");
      mkdirSync("artifacts/charts-svg", { recursive: true });
      writeFileSync(`artifacts/charts-svg/${kind}.pptx`, output.bytes);
      writeFileSync(`artifacts/charts-svg/${kind}.svg`, markup);
    },
  );
  it("preserves generated finite positive and negative chart values across native PPTX caches", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -10000, max: 10000 }), {
          minLength: 1,
          maxLength: 15,
        }),
        (values) => {
          const data: ChartData = {
            kind: "bar",
            stacked: true,
            categories: values.map((_, i) => `Category ${i}`),
            series: [
              { name: "Net", values },
              { name: "Other", values: values.map((v) => -v) },
            ],
          };
          const doc = unwrap(
            engine.parseDocument({
              ...source(data),
              assets: [],
              slides: [
                {
                  id: "s",
                  content: { id: "chart", type: "chart", chart: data },
                },
              ],
            }),
          );
          const parsed = unwrap(
            engine.parsePptx(
              unwrap(engine.writePptx(unwrap(engine.compile(doc)).scene)).bytes,
            ),
          );
          const element = parsed.scene.slides[0]?.elements[0];
          if (element?.type !== "chart")
            throw Error("Missing chart after round trip");
          expect(element.chart.series.map((s) => s.values)).toEqual([
            values.map((v) => (v === 0 ? 0 : v)),
            values.map((v) => (v === 0 ? 0 : -v)),
          ]);
          expect(element.chart.stacked).toBe(true);
        },
      ),
      { numRuns: 20 },
    );
  });
  it("rejects invalid charts atomically and enforces a cumulative host chart budget", () => {
    const deck = unwrap(createDeck(source(chart), { engine }));
    const before = deck.exportDocument();
    for (const data of [
      { ...chart, series: [{ name: "Missing values", values: [1] }] },
      { ...chart, kind: "pie" as const },
      { ...chart, kind: "line" as const, stacked: true },
      { ...chart, series: [{ name: "NaN", values: [NaN, 1, 2, 3] }] },
    ]) {
      expect(
        deck.apply([{ type: "setChartData", nodeId: "chart", chart: data }]).ok,
      ).toBe(false);
      expect(deck.exportDocument()).toBe(before);
    }
    const module = new WebAssembly.Module(
      readFileSync("packages/wasm/lipat.wasm"),
    );
    const limited = unwrap(
      createLipatFromModule(module, { limits: { maxChartPoints: 10 } }),
    );
    const input: DeckInput = {
      id: "budget",
      slides: [
        {
          id: "s",
          content: {
            id: "body",
            type: "row",
            children: [
              { id: "a", type: "chart", chart },
              { id: "b", type: "chart", chart },
            ],
          },
        },
      ],
    };
    expect(limited.parseDocument(input)).toMatchObject({
      ok: false,
      error: {
        reason: "resourceLimit",
        message: expect.stringContaining("maxChartPoints"),
      },
    });
  });
  it.each([
    "<script>alert(1)</script>",
    "<foreignObject><div>unsafe</div></foreignObject>",
    '<image href="https://example.com/tracker.png"/>',
    '<use href="#loop" id="loop"/>',
    '<rect onclick="alert(1)"/>',
    '<rect fill="url(https://example.com/a.svg#b)"/>',
    '<style>@import "https://example.com/style.css"</style>',
    '<rect style="fill:url(https://example.com/x)"/>',
    '<animate attributeName="x"/>',
    '<rect onload="alert(1)"/>',
  ])("rejects SVG executable or externally fetching content: %s", (body) => {
    const asset = createSvgAsset({
      id: "unsafe",
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${body}</svg>`,
    });
    const input = source(chart);
    expect(
      engine.parseDocument({ ...input, assets: [{ ...asset, id: "vector" }] }),
    ).toMatchObject({ ok: false, error: { reason: "invalidSvg" } });
    const scene = unwrap(
      engine.compile(unwrap(engine.parseDocument(input))),
    ).scene;
    const altered = { ...scene, assets: [{ ...asset, id: "vector" }] };
    expect(
      renderSlideSvg(altered, "s1", { imagePolicy: "embedded-only" }),
    ).not.toContain(body);
  });
  it("scopes repeated gradient and clip IDs independently across SVG instances", () => {
    const doc = unwrap(engine.parseDocument(source(chart)));
    const scene = unwrap(engine.compile(doc)).scene;
    const slide = scene.slides[0];
    if (!slide) throw Error("Missing slide");
    const logo = slide.elements.find((e) => e.id === "logo");
    if (!logo) throw Error("Missing image");
    const markup = renderSlideSvg(
      {
        ...scene,
        slides: [
          { ...slide, elements: [logo, { ...logo, id: "second-logo" }] },
        ],
      },
      "s1",
    );
    const ids = [...markup.matchAll(/id="(svg-[^"]+-paint)"/g)].map(
      (m) => m[1],
    );
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
  it("isolates changed SVG artwork when two scene previews reuse the same node IDs", () => {
    const scene = unwrap(
      engine.compile(unwrap(engine.parseDocument(source(chart)))),
    ).scene;
    const changed = {
      ...scene,
      assets: [
        createSvgAsset({
          id: "vector",
          svg: svg.replace("#5856D6", "#FF0000"),
        }),
      ],
    };
    const paintId = (markup: string) =>
      /id="(svg-[^"]+-paint)"/.exec(markup)?.[1];
    const originalId = paintId(renderSlideSvg(scene, "s1"));
    const changedId = paintId(renderSlideSvg(changed, "s1"));
    expect(originalId).toBeDefined();
    expect(changedId).toBeDefined();
    expect(changedId).not.toBe(originalId);
    expect(renderSlideSvg(changed, "s1")).toContain(`url(#${changedId})`);
  });
  it("isolates doughnut masks when previews reuse an ID at different sizes", () => {
    const series = chart.series[0];
    if (!series) throw Error("Missing fixture series");
    const doc = unwrap(
      engine.parseDocument(
        source({ ...chart, kind: "doughnut", series: [series] }),
      ),
    );
    const scene = unwrap(engine.compile(doc)).scene;
    const element = scene.slides[0]?.elements.find((e) => e.type === "chart");
    if (!element) throw Error("Missing chart");
    const first = renderSceneElementSvg(scene, element);
    const second = renderSceneElementSvg(scene, {
      ...element,
      frame: { ...element.frame, width: 320, height: 200 },
    });
    const maskId = (markup: string) => /<mask id="([^"]+)"/.exec(markup)?.[1];
    expect(maskId(first)).toBeDefined();
    expect(maskId(second)).not.toBe(maskId(first));
  });
});
