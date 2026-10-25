import type { DeckInput, EntranceAnimation } from "@byfungsi/lipat";

const effects: readonly {
  readonly effect: EntranceAnimation["effect"];
  readonly title: string;
  readonly text: string;
}[] = [
  { effect: "fade", title: "01 / Fade", text: "An idea comes into focus." },
  { effect: "rise", title: "02 / Rise", text: "A little lift adds emphasis." },
  {
    effect: "slide",
    title: "03 / Slide",
    text: "Bring the next point into view.",
  },
  {
    effect: "zoom",
    title: "04 / Zoom",
    text: "Make room for the final detail.",
  },
];

/** Animation sample reveals one effect per step; its JSON remains editable and exportable. */
export const animationDeck: DeckInput = {
  id: "lipat-animation-sample",
  title: "Ideas in motion",
  slides: [
    {
      id: "motion-showcase",
      title: "Ideas in motion",
      notes:
        "Advance four times to compare the entrance effects. Move backward, then forward to replay. Reduced motion follows your device preference.",
      content: {
        id: "motion-content",
        type: "stack",
        gap: 28,
        children: [
          {
            id: "motion-eyebrow",
            type: "text",
            text: "LIPAT / ANIMATION SAMPLE",
            style: { fontSize: 16, bold: true, color: "#5B5BD6" },
          },
          {
            id: "motion-title",
            type: "heading",
            text: "Ideas in motion.",
            style: { fontSize: 58 },
          },
          {
            id: "motion-instructions",
            type: "text",
            text: "Press Next or → to reveal each effect.\nUse Previous or ←, then advance to replay.",
            style: { fontSize: 23, color: "#667085" },
          },
          {
            id: "motion-effects",
            type: "grid",
            columns: 4,
            gap: 24,
            children: effects.map(({ effect, title, text }, index) => ({
              id: `motion-${effect}`,
              type: "text",
              step: index + 1,
              text: [
                { text: `${title}\n`, style: { bold: true, color: "#5B5BD6" } },
                { text },
              ],
              style: { fontSize: 23 },
              animation: { effect, durationMs: 500, easing: "easeOut" },
            })),
          },
        ],
      },
    },
  ],
};
