import type { DeckSlide, DeckTheme, SlideNode } from "@lipat-internal/model";
/** Complete portable themes; hosts may copy and override individual tokens. */
export const deckThemes: {
  readonly editorial: DeckTheme;
  readonly midnight: DeckTheme;
  readonly paper: DeckTheme;
} = {
  editorial: {
    fontFamily: "Arial",
    fontSize: 24,
    headingSize: 48,
    foreground: "#172033",
    background: "#FFFFFF",
    accent: "#5B5BD6",
    padding: 48,
    gap: 24,
  },
  midnight: {
    fontFamily: "Arial",
    fontSize: 24,
    headingSize: 48,
    foreground: "#F2F4F7",
    background: "#151923",
    accent: "#AFA7FF",
    padding: 48,
    gap: 24,
  },
  paper: {
    fontFamily: "Georgia",
    fontSize: 24,
    headingSize: 46,
    foreground: "#302C27",
    background: "#FAF7F0",
    accent: "#A64B2A",
    padding: 48,
    gap: 24,
  },
};
/** Title-slide preset expands into ordinary editable nodes with predictable stable IDs. */
export function createTitleSlide(input: {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly notes?: string;
}): DeckSlide {
  return {
    id: input.id,
    title: input.title,
    notes: input.notes ?? "",
    content: {
      id: `${input.id}-body`,
      type: "stack",
      gap: 28,
      children: [
        { id: `${input.id}-title`, type: "heading", text: input.title },
        ...(input.subtitle
          ? [
              {
                id: `${input.id}-subtitle`,
                type: "text" as const,
                text: input.subtitle,
              },
            ]
          : []),
      ],
    },
  };
}
/** Comparison preset is a grid of semantic columns, without manual coordinates. */
export function createComparisonSlide(input: {
  readonly id: string;
  readonly title: string;
  readonly columns: readonly {
    readonly title: string;
    readonly body: string;
  }[];
  readonly notes?: string;
}): DeckSlide {
  return {
    id: input.id,
    title: input.title,
    notes: input.notes ?? "",
    content: {
      id: `${input.id}-body`,
      type: "stack",
      gap: 32,
      children: [
        { id: `${input.id}-title`, type: "heading", text: input.title },
        {
          id: `${input.id}-columns`,
          type: "grid",
          columns: Math.max(1, input.columns.length),
          gap: 28,
          children: input.columns.map((column, i) => ({
            id: `${input.id}-column-${i}`,
            type: "stack",
            gap: 16,
            children: [
              {
                id: `${input.id}-column-${i}-title`,
                type: "heading",
                level: 2,
                text: column.title,
                style: { fontSize: 30 },
              },
              {
                id: `${input.id}-column-${i}-body`,
                type: "text",
                text: column.body,
              },
            ],
          })),
        },
      ],
    },
  };
}
/** Content preset composes caller-owned nodes beneath a heading. */
export function createContentSlide(input: {
  readonly id: string;
  readonly title: string;
  readonly content: readonly SlideNode[];
  readonly notes?: string;
}): DeckSlide {
  return {
    id: input.id,
    title: input.title,
    notes: input.notes ?? "",
    content: {
      id: `${input.id}-body`,
      type: "stack",
      children: [
        { id: `${input.id}-title`, type: "heading", text: input.title },
        ...input.content,
      ],
    },
  };
}
