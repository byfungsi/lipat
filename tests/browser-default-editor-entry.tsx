import { createRoot } from "react-dom/client";
import { DeckEditor } from "@byfungsi/lipat/react";
import { createLipat, createDeck } from "@byfungsi/lipat";
const response = await fetch("/test-wasm");
const bytes = new Uint8Array(await response.arrayBuffer());
const initialized = createLipat(bytes);
if (!initialized.ok) throw Error(initialized.error.message);
const created = createDeck(
  {
    id: "default-browser",
    slides: [
      {
        id: "s",
        content: {
          id: "canvas",
          type: "canvas",
          children: [
            {
              id: "zoom",
              type: "shape",
              geometry: "rect",
              fill: "#5B5BD6",
              frame: { x: 40, y: 40, width: 140, height: 100 },
              step: 1,
              animation: { effect: "zoom", durationMs: 1000 },
            },
          ],
        },
      },
    ],
  },
  { engine: initialized.value },
);
if (!created.ok) throw Error(created.error.message);
const root = document.getElementById("root");
if (!root) throw Error("Default editor fixture root missing");
createRoot(root).render(<DeckEditor deck={created.value} />);
