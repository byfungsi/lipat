import { expect, it } from "vitest";
import { createDeck } from "@byfungsi/lipat";
import {
  createPresentationTemplate,
  presentationTemplates,
} from "@byfungsi/lipat/templates";
import { renderSlideSvg } from "@byfungsi/lipat/render";
import { testEngine, unwrap } from "./engine-fixture";

const engine = testEngine();
it("provides exactly thirty named, distinct six-slide templates with useful catalog metadata", () => {
  expect(presentationTemplates).toHaveLength(30);
  expect(new Set(presentationTemplates.map((t) => t.id)).size).toBe(30);
  expect(new Set(presentationTemplates.map((t) => t.domain)).size).toBe(30);
  for (const template of presentationTemplates) {
    expect(template.description.length).toBeGreaterThan(40);
    expect(template.slideTitles).toHaveLength(6);
    expect(new Set(template.slideTitles).size).toBe(6);
  }
  expect(createPresentationTemplate("does-not-exist")).toMatchObject({
    ok: false,
    error: { reason: "invalidTemplate" },
  });
});
it.each(presentationTemplates)(
  "$name compiles six editable offline slides without measured overflow and survives PPTX round trip",
  (template) => {
    const input = unwrap(createPresentationTemplate(template.id));
    const deck = unwrap(createDeck(input, { engine }));
    const compiled = unwrap(deck.compile());
    expect(compiled.scene.slides).toHaveLength(6);
    expect(
      compiled.diagnostics.filter((d) => d.bounds),
      template.id,
    ).toEqual([]);
    expect(
      compiled.scene.assets.every((a) => a.mimeType === "image/svg+xml"),
    ).toBe(true);
    expect(
      compiled.scene.slides
        .flatMap((s) => s.elements)
        .filter((e) => e.type === "image")
        .every((e) => e.assetId !== undefined),
    ).toBe(true);
    for (const slide of compiled.scene.slides) {
      const markup = renderSlideSvg(compiled.scene, slide.id, {
        imagePolicy: "embedded-only",
      });
      expect(markup).toContain("<text");
      expect(markup).not.toContain("<script");
      expect(
        slide.elements.filter((e) => e.type === "text").length,
      ).toBeGreaterThan(3);
    }
    const output = unwrap(engine.writePptx(compiled.scene));
    const imported = unwrap(engine.parsePptx(output.bytes));
    expect(imported.scene.slides).toHaveLength(6);
    const originalCharts = compiled.scene.slides
      .flatMap((s) => s.elements)
      .filter((e) => e.type === "chart");
    const importedCharts = imported.scene.slides
      .flatMap((s) => s.elements)
      .filter((e) => e.type === "chart");
    expect(
      importedCharts.map((e) => e.chart.series.map((s) => s.values)),
    ).toEqual(originalCharts.map((e) => e.chart.series.map((s) => s.values)));
    const editable = unwrap(engine.importScene(imported.scene));
    expect(unwrap(engine.compile(editable)).scene.slides).toHaveLength(6);
    const text = compiled.scene.slides[0]?.elements.find(
      (e) => e.type === "text",
    );
    if (!text) throw Error("Template cover has no editable text");
    unwrap(
      deck.apply([
        { type: "updateText", nodeId: text.id, text: "Updated by the host" },
      ]),
    );
    expect(JSON.stringify(deck.exportDocument())).toContain(
      "Updated by the host",
    );
  },
);
it("creates independent decks with customized identity, cover title and organization", () => {
  const first = unwrap(
    createPresentationTemplate("revenue-pulse", {
      id: "my-review",
      title: "A stronger year",
      organization: "Acme",
    }),
  );
  const second = unwrap(createPresentationTemplate("revenue-pulse"));
  expect(first.id).toBe("my-review");
  expect(first.slides[0]?.title).toBe("A stronger year");
  expect(JSON.stringify(first)).toContain("Acme");
  expect(JSON.stringify(second)).not.toContain("Acme");
  const nodes = first.slides.flatMap((s) =>
    "children" in s.content ? s.content.children : [s.content],
  );
  const chart = nodes.find((n) => n.type === "chart");
  if (!chart || chart.type !== "chart" || !chart.chart.series[0])
    throw Error("Review template has no data chart");
  Reflect.set(chart.chart.series[0].values, "0", 99999);
  expect(JSON.stringify(second)).not.toContain("99999");
  expect(unwrap(engine.parseDocument(second)).title).toBe("Revenue Pulse");
});
