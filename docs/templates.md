# Presentation templates

Unreleased additions after 0.6.0; use the current source build until the next package release.

Lipat includes **30 original six-slide deck templates** spanning business, education, research, health, public service, operations and creative work. They are complete editable decks with text, shapes, native charts where useful, speaker notes and embedded original SVG artwork. They render without remote images or fonts. All sample figures, organizations, quotations and scenarios are illustrative.

[Browse the template gallery](./playground/index.html?sample=templates). Preview every slide, open a deck in the editor, or download a ready-to-use PPTX. The gallery's source JSON and standalone HTML downloads are also generated alongside each template's PPTX.

## List and instantiate

```ts
import {
  presentationTemplates,
  createPresentationTemplate,
} from "@byfungsi/lipat/templates";
import { createDeck } from "@byfungsi/lipat";

// Catalog metadata needs no engine, DOM, React or network.
const choices = presentationTemplates.map(
  ({ id, name, domain, description }) => ({
    id,
    name,
    domain,
    description,
  }),
);

const input = createPresentationTemplate("product-horizon", {
  id: "team-roadmap",
  title: "A simpler first week",
  organization: "Acme",
});
if (input.ok) {
  const deck = createDeck(input.value, { engine });
  if (deck.ok) {
    const compiled = deck.value.compile();
    if (compiled.ok) {
      // Inspect diagnostics, then export or display compiled.value.scene.
      const pptx = engine.writePptx(compiled.value.scene);
    }
  }
}
```

The optional `/templates` entrypoint keeps the catalog out of core/Worker imports that do not use it. An unknown template ID returns `invalidTemplate`. An optional deck ID must be an ASCII slug of 1–128 letters, digits, dots, underscores or hyphens, starting with a letter or digit. Each call creates independent nodes, chart arrays, theme and assets.

The canvas is 1280 × 720 points. Templates use Arial, Georgia and Courier New as portable font requests; the host controls installed fonts and metrics. These names do not bundle those fonts. SVG compatibility PNGs use bundled OFL Lato for text if a requested font is unavailable. Template artwork itself consists of shapes and paths; meaningful labels remain ordinary editable text.

## Thirty starting points

| ID                     | Name                 | Use case                       |
| ---------------------- | -------------------- | ------------------------------ |
| `venture-signal`       | Venture Signal       | Startup pitch                  |
| `boardroom-brief`      | Boardroom Brief      | Board decision                 |
| `revenue-pulse`        | Revenue Pulse        | Quarterly business review      |
| `product-horizon`      | Product Horizon      | Product roadmap                |
| `launch-studio`        | Launch Studio        | Product launch                 |
| `strategy-compass`     | Strategy Compass     | Annual strategy                |
| `client-proposal`      | Client Proposal      | Professional services          |
| `campaign-spectrum`    | Campaign Spectrum    | Marketing campaign             |
| `brand-manifesto`      | Brand Manifesto      | Brand system                   |
| `research-lens`        | Research Lens        | Customer research              |
| `academic-defense`     | Academic Defense     | Thesis defense                 |
| `lesson-spark`         | Lesson Spark         | Classroom lesson               |
| `workshop-canvas`      | Workshop Canvas      | Team facilitation              |
| `onboarding-path`      | Onboarding Path      | Employee onboarding            |
| `clinical-evidence`    | Clinical Evidence    | Clinical study readout         |
| `public-health`        | Public Health        | Community intervention         |
| `climate-ledger`       | Climate Ledger       | Sustainability reporting       |
| `nonprofit-impact`     | Nonprofit Impact     | Donor and impact update        |
| `civic-plan`           | Civic Plan           | Public service proposal        |
| `architecture-atelier` | Architecture Atelier | Architectural concept          |
| `property-portfolio`   | Property Portfolio   | Real estate opportunity        |
| `hospitality-journey`  | Hospitality Journey  | Guest experience               |
| `culinary-story`       | Culinary Story       | Food and restaurant concept    |
| `retail-season`        | Retail Season        | Seasonal merchandising         |
| `supply-chain`         | Supply Chain         | Operations resilience          |
| `finance-outlook`      | Finance Outlook      | Financial forecast             |
| `security-brief`       | Security Brief       | Security risk update           |
| `developer-keynote`    | Developer Keynote    | Technical product talk         |
| `creative-portfolio`   | Creative Portfolio   | Design portfolio               |
| `event-program`        | Event Program        | Conference and community event |

## Make a template your own

Inspect the runtime outline to find stable node IDs. Use `updateText`, `updateStyle`, `setChartData`, `setFrame`, `replaceNode`, `upsertAsset` and the other ordinary operations. The source contains no template interpreter or runtime binding: it is a normal `DeckInput` expanded to canvas nodes. The parser remains independent of creation.

Replacing text can change wrapping. Recompile after edits, inspect measured diagnostics, and expand or restructure content when needed. Do not assume a cover designed for a short statement can hold an arbitrary paragraph. Replace and verify the illustrative content, figures, sources, contacts, assumptions and dates before presenting.

## Design references

The collection uses original layouts and artwork informed by first-party guidance on readable hierarchy, purposeful whitespace and consistent alignment: [Microsoft's presentation guidance](https://support.microsoft.com/en-us/powerpoint/tips-for-creating-and-delivering-an-effective-presentation), [Canva on whitespace](https://www.canva.com/learn/white-space-design/), [Duarte on contrast](https://www.duarte.com/blog/ultimate-guide-to-contrast/), and [Sequoia's pitch narrative](https://articles.sequoiacap.com/writing-a-business-plan). No proprietary template files, logos or reference screenshots are shipped.
