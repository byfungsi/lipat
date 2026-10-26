# Presentation templates

Unreleased additions after 0.6.0; use the current source build until the next package release.

Lipat includes **60 original six-slide deck templates** spanning business, education, research, health, public service, operations and creative work. They are complete editable decks with text, shapes, native charts where useful, speaker notes and embedded editorial photography. They render without remote images or fonts. All sample figures, organizations, quotations and scenarios are illustrative.

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

The canvas is 1280 × 720 points. Templates use Arial, Georgia and Courier New as portable font requests; the host controls installed fonts and metrics. These names do not bundle those fonts. Photographs are embedded JPEGs; meaningful labels remain ordinary editable text. Fifteen original AI-generated illustrative photographs are shared across six cover composition families. The asset prompts and provenance are recorded in `packages/templates/assets/README.md`. They depict fictional subjects, not real projects or evidence. The optional templates bundle includes roughly 3.4 MB of JPEG source imagery (base64 adds overhead); importing the core SDK does not load it.

## Sixty starting points

The gallery filters by audience and combines the selected category with text search. Category IDs are stable catalog metadata, available without WASM.

```ts
import {
  presentationTemplates,
  presentationTemplateCategories,
} from "@byfungsi/lipat/templates";
const talks = presentationTemplates.filter(
  (template) => template.category === "technology",
);
```

### Students & learning

Coursework, study, teaching and personal development.

| ID                      | Name                  | Use case                           |
| ----------------------- | --------------------- | ---------------------------------- |
| `lesson-spark`          | Lesson Spark          | Classroom lesson                   |
| `workshop-canvas`       | Workshop Canvas       | Team facilitation                  |
| `onboarding-path`       | Onboarding Path       | Employee onboarding                |
| `course-project`        | Course Project        | Course project presentation        |
| `literature-seminar`    | Literature Seminar    | Humanities seminar                 |
| `lab-report`            | Lab Report            | Student laboratory report          |
| `capstone-showcase`     | Capstone Showcase     | Student capstone showcase          |
| `study-group`           | Study Group           | Peer study session                 |
| `debate-case`           | Debate Case           | Student debate argument            |
| `internship-reflection` | Internship Reflection | Internship learning review         |
| `scholarship-story`     | Scholarship Story     | Scholarship interview presentation |

### Research

Proposals, methods, evidence and scholarly conversations.

| ID                   | Name               | Use case                         |
| -------------------- | ------------------ | -------------------------------- |
| `research-lens`      | Research Lens      | Customer research                |
| `academic-defense`   | Academic Defense   | Thesis defense                   |
| `clinical-evidence`  | Clinical Evidence  | Clinical study readout           |
| `research-proposal`  | Research Proposal  | Research proposal review         |
| `literature-map`     | Literature Map     | Research literature synthesis    |
| `methods-protocol`   | Methods Protocol   | Research protocol walkthrough    |
| `conference-paper`   | Conference Paper   | Research conference presentation |
| `poster-pitch`       | Poster Pitch       | Research poster conversation     |
| `replication-report` | Replication Report | Replication study readout        |
| `fieldwork-journal`  | Fieldwork Journal  | Qualitative fieldwork update     |
| `grant-case`         | Grant Case         | Research funding proposal        |

### Tech talks

Technical explanations, demonstrations and workshops.

| ID                       | Name                   | Use case                           |
| ------------------------ | ---------------------- | ---------------------------------- |
| `security-brief`         | Security Brief         | Security risk update               |
| `developer-keynote`      | Developer Keynote      | Technical product talk             |
| `tech-lightning`         | Tech Lightning         | Technical lightning talk           |
| `architecture-deep-dive` | Architecture Deep Dive | Software architecture talk         |
| `live-demo`              | Live Demo              | Technical product demonstration    |
| `open-source-story`      | Open Source Story      | Open source project talk           |
| `performance-lab`        | Performance Lab        | Software performance investigation |
| `incident-learning`      | Incident Learning      | Technical incident review          |
| `api-workshop`           | API Workshop           | Hands-on developer workshop        |
| `migration-journey`      | Migration Journey      | Technical migration case study     |

### Marketing & creative

Audiences, brands, campaigns and creative work.

| ID                       | Name                   | Use case                          |
| ------------------------ | ---------------------- | --------------------------------- |
| `launch-studio`          | Launch Studio          | Product launch                    |
| `campaign-spectrum`      | Campaign Spectrum      | Marketing campaign                |
| `brand-manifesto`        | Brand Manifesto        | Brand system                      |
| `creative-portfolio`     | Creative Portfolio     | Design portfolio                  |
| `event-program`          | Event Program          | Conference and community event    |
| `positioning-story`      | Positioning Story      | Product positioning strategy      |
| `audience-insights`      | Audience Insights      | Marketing audience research       |
| `content-calendar`       | Content Calendar       | Editorial content planning        |
| `social-experiment`      | Social Experiment      | Social campaign experiment        |
| `brand-partnership`      | Brand Partnership      | Co-marketing partnership proposal |
| `campaign-retrospective` | Campaign Retrospective | Marketing campaign review         |

### Business

Strategy, decisions, performance and proposals.

| ID                 | Name             | Use case                  |
| ------------------ | ---------------- | ------------------------- |
| `venture-signal`   | Venture Signal   | Startup pitch             |
| `boardroom-brief`  | Boardroom Brief  | Board decision            |
| `revenue-pulse`    | Revenue Pulse    | Quarterly business review |
| `product-horizon`  | Product Horizon  | Product roadmap           |
| `strategy-compass` | Strategy Compass | Annual strategy           |
| `client-proposal`  | Client Proposal  | Professional services     |
| `finance-outlook`  | Finance Outlook  | Financial forecast        |

### Industry & impact

Places, services, operations and public benefit.

| ID                     | Name                 | Use case                    |
| ---------------------- | -------------------- | --------------------------- |
| `public-health`        | Public Health        | Community intervention      |
| `climate-ledger`       | Climate Ledger       | Sustainability reporting    |
| `nonprofit-impact`     | Nonprofit Impact     | Donor and impact update     |
| `civic-plan`           | Civic Plan           | Public service proposal     |
| `architecture-atelier` | Architecture Atelier | Architectural concept       |
| `property-portfolio`   | Property Portfolio   | Real estate opportunity     |
| `hospitality-journey`  | Hospitality Journey  | Guest experience            |
| `culinary-story`       | Culinary Story       | Food and restaurant concept |
| `retail-season`        | Retail Season        | Seasonal merchandising      |
| `supply-chain`         | Supply Chain         | Operations resilience       |

## Make a template your own

Inspect the runtime outline to find stable node IDs. Use `updateText`, `updateStyle`, `setChartData`, `setFrame`, `replaceNode`, `upsertAsset` and the other ordinary operations. The source contains no template interpreter or runtime binding: it is a normal `DeckInput` expanded to canvas nodes. The parser remains independent of creation.

Replacing text can change wrapping. Recompile after edits, inspect measured diagnostics, and expand or restructure content when needed. Do not assume a cover designed for a short statement can hold an arbitrary paragraph. Replace and verify the illustrative content, figures, sources, contacts, assumptions and dates before presenting.

## Design references

The collection uses original layouts and imagery informed by first-party guidance on readable hierarchy, purposeful whitespace and consistent alignment: [Microsoft's presentation guidance](https://support.microsoft.com/en-us/powerpoint/tips-for-creating-and-delivering-an-effective-presentation), [Canva on whitespace](https://www.canva.com/learn/white-space-design/), [Duarte on contrast](https://www.duarte.com/blog/ultimate-guide-to-contrast/), and [Sequoia's pitch narrative](https://articles.sequoiacap.com/writing-a-business-plan). No proprietary template files, logos or reference screenshots are shipped.

The photographic revision follows [a critique and visual research](research/presentation-template-redesign.md), including Pentagram’s architecture and craft art direction. Covers use large display headlines; interiors alternate open editorial columns, photographic statements, quiet evidence charts and bold closing slides. Text, charts and photo frames remain editable.
