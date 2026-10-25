import type { DeckInput } from "@byfungsi/lipat";

/** A direct image URL sample with one animated image and an independent PPTX export path. */
export function createImageDeck(url: string): DeckInput {
  return {
    id: "image-url-sample",
    title: "Images that travel",
    slides: [
      {
        id: "image-slide",
        title: "Images that travel",
        content: {
          id: "image-canvas",
          type: "canvas",
          children: [
            {
              id: "image-title",
              type: "heading",
              text: "Images that travel.",
              frame: { x: 55, y: 55, width: 840, height: 70 },
              style: { fontSize: 44 },
            },
            {
              id: "image-description",
              type: "text",
              text: "One image URL. Browser preview and an embedded PowerPoint download. Press Next to reveal.",
              frame: { x: 55, y: 155, width: 330, height: 200 },
              style: { fontSize: 24 },
            },
            {
              id: "remote-image",
              type: "image",
              url,
              alt: "Folded paper illustration",
              fit: "contain",
              frame: { x: 440, y: 150, width: 440, height: 300 },
              step: 1,
              animation: { effect: "zoom", durationMs: 500, easing: "linear" },
            },
          ],
        },
      },
    ],
  };
}
