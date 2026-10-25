import type { DeckInput } from "@byfungsi/lipat";
export const sampleDeck: DeckInput = {
  id: "lipat-demo",
  title: "A new way to make your point",
  slides: [
    {
      id: "welcome",
      title: "Meet Lipat",
      notes:
        "Lipat means fold in Indonesian. Start with a simple idea and give it shape.",
      content: {
        id: "welcome-stack",
        type: "stack",
        gap: 28,
        children: [
          {
            id: "eyebrow",
            type: "text",
            text: "LIPAT / AN OPEN SLIDE ENGINE",
            style: { fontSize: 16, bold: true, color: "#5B5BD6" },
          },
          {
            id: "headline",
            type: "heading",
            text: "Less positioning.\nMore possibility.",
            style: { fontSize: 66 },
            animation: { effect: "rise", durationMs: 450 },
          },
          {
            id: "intro",
            type: "text",
            text: "Create with content and layout intent.\nLet the portable engine handle the details.",
            style: { fontSize: 25, color: "#667085" },
            animation: { effect: "fade", durationMs: 350, delayMs: 80 },
          },
          {
            id: "footer",
            type: "text",
            text: "01 — Made for humans and agents",
            style: { fontSize: 14, color: "#667085" },
          },
        ],
      },
    },
    {
      id: "workflow",
      title: "The authoring loop",
      notes:
        "Each edit targets a stable node identity. A failed batch changes nothing.",
      content: {
        id: "workflow-stack",
        type: "stack",
        gap: 30,
        children: [
          {
            id: "workflow-heading",
            type: "heading",
            text: "A small API. A complete loop.",
          },
          {
            id: "workflow-columns",
            type: "grid",
            columns: 3,
            gap: 26,
            children: [
              {
                id: "inspect-column",
                type: "stack",
                gap: 14,
                children: [
                  {
                    id: "inspect-label",
                    type: "heading",
                    level: 2,
                    text: "01 / Inspect",
                    style: { fontSize: 28, color: "#5B5BD6" },
                  },
                  {
                    id: "inspect-body",
                    type: "text",
                    text: "Read content, stable IDs and the current revision.",
                    style: { fontSize: 22 },
                  },
                ],
              },
              {
                id: "edit-column",
                type: "stack",
                gap: 14,
                children: [
                  {
                    id: "edit-label",
                    type: "heading",
                    level: 2,
                    text: "02 / Edit",
                    style: { fontSize: 28, color: "#5B5BD6" },
                  },
                  {
                    id: "edit-body",
                    type: "text",
                    text: "Apply small atomic operations. Keep the layout abstract.",
                    style: { fontSize: 22 },
                  },
                ],
              },
              {
                id: "preview-column",
                type: "stack",
                gap: 14,
                children: [
                  {
                    id: "preview-label",
                    type: "heading",
                    level: 2,
                    text: "03 / Refine",
                    style: { fontSize: 28, color: "#5B5BD6" },
                  },
                  {
                    id: "preview-body",
                    type: "text",
                    text: "Compile, inspect diagnostics, preview and revise.",
                    style: { fontSize: 22 },
                  },
                ],
              },
            ],
          },
          {
            id: "workflow-caption",
            type: "text",
            text: "One semantic document → one resolved scene → many outputs.",
            style: { fontSize: 20, color: "#667085" },
            step: 1,
            animation: { effect: "slide", durationMs: 400 },
          },
        ],
      },
    },
    {
      id: "portable",
      title: "Create anywhere",
      content: {
        id: "portable-stack",
        type: "stack",
        gap: 28,
        children: [
          {
            id: "portable-heading",
            type: "heading",
            text: "One engine.\nEverywhere you work.",
          },
          {
            id: "portable-table",
            type: "table",
            columns: ["Layer", "Responsibility"],
            rows: [
              ["Document", "Content, intent, themes and stable identities"],
              ["Compiler", "Deterministic layout and diagnostics"],
              ["PPTX adapter", "Independent import and export"],
              ["Rust / WASM", "The same core, native or in the browser"],
            ],
            style: { fontSize: 20 },
          },
          {
            id: "portable-note",
            type: "text",
            text: "PPTX is an adapter. Your ideas are the source.",
            style: { fontSize: 21, color: "#5B5BD6" },
          },
        ],
      },
    },
  ],
};
