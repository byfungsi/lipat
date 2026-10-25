# Create slides

Initialize the engine and call `createDeck(input, { engine })`. Only a deck ID and at least one slide with an ID/content node are required. The native parser supplies version 1, widescreen dimensions, an Arial theme, empty assets, and optional metadata defaults.

```ts
import {
  createDeck,
  createTitleSlide,
  createComparisonSlide,
  deckThemes,
} from "@byfungsi/lipat";
const created = createDeck(
  {
    id: "pitch",
    theme: deckThemes.editorial,
    slides: [
      createTitleSlide({
        id: "opening",
        title: "A better workflow",
        subtitle: "Built with Lipat",
      }),
      createComparisonSlide({
        id: "comparison",
        title: "Before and after",
        columns: [
          { title: "Before", body: "Manual positioning" },
          { title: "After", body: "Content and layout intent" },
        ],
      }),
    ],
  },
  { engine },
);
```

Presets return ordinary source nodes with predictable IDs, such as `opening-title` and `comparison-column-0-body`. Write reusable component functions that return `SlideNode` or `DeckSlide`; expand them before sending JSON to the engine. Documents contain data, not callbacks.

## Node vocabulary

- `heading`: string/rich text and heading level 1–6. Size comes from the theme or explicit style; levels currently do not change the default size.
- `text`: string or rich text runs.
- `list`: string items with bullet or ordered numbering.
- `code`: plain code and language metadata; syntax highlighting is a host extension.
- `image`: an embedded asset identity or absolute HTTP(S) URL, alternative text and contain/cover/stretch fit.
- `shape`: rectangle, rounded rectangle, ellipse or line, with explicit fill/stroke.
- `table`: header columns and rectangular string rows.
- `stack`: vertical flow; children keep natural heights.
- `row`: equal-width columns sharing available height.
- `grid`: equal-width columns with row heights based on content.
- `canvas`: positioned children, each with an explicit frame.

Container styles inherit through the tree. Each node may supply a frame relative to its layout slot. In a canvas the slot is the canvas origin. Explicit frames are the escape hatch for precision; semantic layout remains the default.

## Markdown

```ts
import { fromMarkdown, createDeck } from "@byfungsi/lipat";
const source = fromMarkdown("# Hello\n\n- One\n- Two\n---\n# Next slide", {
  id: "notes",
});
if (source.ok) createDeck(source.value, { engine });
```

Supported syntax: headings, paragraphs, ordered/unordered lists, fenced code, simple pipe tables and `![alt](asset:asset-id)` embedded images or `![alt](https://example.com/photo.png)` URL images. `---` separates horizontal slides; `--` starts a vertical slide under the preceding top-level slide. `Notes:` starts speaker notes through the end of that slide. Separators inside fenced code stay code. Rich inline Markdown and HTML are not supplied. Markdown parsing does not fetch remote images; see [image resolution](./images.md).

Use `importMarkdown(source, {id, engine, compileOptions?})` for import feedback: it returns a validated `document`, compiled `scene`, detected slide count/source boundaries, and layout diagnostics. When a single slide overflows it adds `markdownSingleSlideOverflow`; headings still do not become slide breaks. See [measured diagnostics and host export policy](./diagnostics.md).

## Text measurement

`deck.compile({fonts:[{family:'Arial',averageWidth:0.52,lineHeight:1.2,glyphWidths:{W:0.9,i:0.2}}]})` supplies normalized glyph widths and line-height multipliers. Missing glyphs use the supplied average. Without metrics the deterministic fallback emits `fontMetricsFallback`. Complex shaping, automatic font fitting and font embedding are outside this version.
