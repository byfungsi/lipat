# Layout and Markdown diagnostics

Compile the **current working document before export**. Lipat measures text and semantic layout in the Rust compiler and returns diagnostics beside the scene. The same diagnostics cross native and WASM interfaces; no DOM measurements or PowerPoint re-import are needed.

```ts
const compiled = deck.compile({ fonts });
if (!compiled.ok) return showError(compiled.error);
showDiagnostics(compiled.value.diagnostics);

// Host policy: request a revision before exporting content known to overflow.
const overflows = compiled.value.diagnostics.filter(
  (diagnostic) =>
    diagnostic.bounds &&
    Object.values(diagnostic.bounds.overflow).some((n) => n > 0.01),
);
if (overflows.length) return requestRevision(overflows);

const exported = engine.writePptx(compiled.value.scene);
if (!exported.ok) return showError(exported.error);
showDiagnostics([...compiled.value.diagnostics, ...exported.value.diagnostics]);
savePptx(exported.value.bytes);
```

`showDiagnostics`, `requestRevision` and persistence belong to the host. Warnings do not automatically block export or alter content. The low-level PPTX writer accepts a resolved scene, so its diagnostics cover export compatibility; retain the compiler's diagnostics as well. Agent `lipat_export` already combines both sets. The playground now retains both sets, including when exporting HTML.

## Structured measurements

`textOverflow`, `layoutOverflow` and `outsideSlide` include `slideId`, `nodeId`, `bounds` and `recommendations`. Existing `code`, `severity` and `message` remain available. Other compatibility/font diagnostics may have no bounds.

- `textOverflow`: measured wrapped-text height or a glyph/line width exceeds the text frame. Covers text, headings, code and lists, including frames entirely inside the slide.
- `layoutOverflow`: stack/grid flow exceeds its container height. Children retain their natural size; they are not silently shrunk.
- `outsideSlide`: the element's axis-aligned bounds, including rotation around its center, extend beyond the slide.

`bounds.kind` is `text`, `layout` or `slide`. `measured` and `available` use points (72 per inch). Text/layout measurements are in the compiler's layout coordinate space, before element rotation; slide measurements are axis-aligned slide coordinates. `overflow` gives nonnegative `left`, `right`, `top` and `bottom` excess. Text rectangles describe the required layout space, not exact glyph ink outlines.

For example, three text lines at 24 points with a 1.2 line-height multiplier require 86.4 points. In a 30-point-high frame, `bounds.measured.height` is 86.4, `bounds.available.height` is 30 and `bounds.overflow.bottom` is 56.4. The stable recommendations are `resizeNode`, `reduceFontSize`, `splitContent`, `moveNode` and `addSlideBreaks`; these are suggestions for the host/agent, not executable operations.

Measurements follow the compiler's supplied font metrics. Without them, `fontMetricsFallback` explicitly warns that deterministic approximations are in use. These diagnostics do not promise pixel-exact clipping detection across fonts/renderers, complex shaping, per-run font-size changes or advanced table layout. No warning is not a guarantee that arbitrary PowerPoint content fits.

## Markdown import feedback

`fromMarkdown` keeps its existing lightweight `LipatResult<DeckInput>` contract. Use `importMarkdown` when the import flow needs measured feedback:

```ts
import { importMarkdown, createDeck } from "@byfungsi/lipat";

const imported = importMarkdown(source, {
  id: "presentation",
  engine,
  compileOptions: { fonts },
});
if (!imported.ok) return showError(imported.error);

const { document, summary, diagnostics } = imported.value;
showImportSummary(summary.slideCount, summary.boundaries);
showDiagnostics(diagnostics);
const created = createDeck(document, { engine });
```

The result includes the validated working `document`, compiled `scene`, `diagnostics` and `summary`. Boundary records contain the stable `slideId`, 1-based `startLine` (inclusive), `endLine` (exclusive), and `separatorBefore`: document `start`, or a `horizontal`/`vertical` separator with its source line. Separators are excluded from a slide's range. Empty slides have `startLine === endLine`. CRLF/CR line endings are normalized for line numbering. The summary describes the imported source, not subsequent edits.

Boundaries come from the actual Markdown parser. Headings remain content; standalone `---` and `--` lines retain their documented meaning, and separator-looking lines inside fenced code remain code. The absence of `---` is not a parser error.

When import produces exactly one slide **and the compiler reports overflow**, the report adds `markdownSingleSlideOverflow`, with IDs, the relevant bounds and `addSlideBreaks`/`splitContent` recommendations. Short, fitting one-slide documents do not receive this warning. This is based on measured overflow rather than a guessed word-count threshold. Import does not automatically split, shorten or reject that content.

## Reproduction and host integration

A deterministic working-document reproduction is `# Report`, a blank line, and 16 newline-separated `Content line` lines, without slide separators. At default size/theme with Arial metrics `{averageWidth: 0.5, lineHeight: 1.2}`, it produces one slide. The stack requires 542.4 points inside 444 available points and reports 98.4 points of bottom overflow **before export**.

This reproduces a diagnostics/reporting gap; the original Supernala working document was unavailable, so it does not establish the exact cause of that incident. Supernala should retain the pre-export working document/revision, show import boundaries and compiler warnings, and decide whether overflow requires revision before publishing an Artifact. Re-importing an already exported file cannot recover the original authoring layout intent. Agent instruction-following and host export policy remain separate concerns.
