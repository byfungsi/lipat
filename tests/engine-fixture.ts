import { readFileSync } from "node:fs";
import { createLipat, createDeck } from "@byfungsi/lipat";
import type { DeckInput, LipatEngine, LipatResult } from "@byfungsi/lipat";
/** Test failures retain the portable error context. */
export function unwrap<T>(result: LipatResult<T>): T {
  if (!result.ok)
    throw new Error(`${result.error.reason}: ${result.error.message}`);
  return result.value;
}
/** Real Rust WebAssembly instance; no mocked engine path. */
export function testEngine(): LipatEngine {
  return unwrap(
    createLipat(new Uint8Array(readFileSync("packages/wasm/lipat.wasm"))),
  );
}
/** Small semantic source shared across public integration tests. */
export const inputDeck: DeckInput = {
  id: "test",
  title: "Testing Lipat",
  slides: [
    {
      id: "s1",
      title: "First",
      notes: "Speaker notes",
      content: {
        id: "body",
        type: "stack",
        gap: 20,
        children: [
          { id: "title", type: "heading", text: "Hello Lipat" },
          {
            id: "columns",
            type: "grid",
            columns: 2,
            children: [
              { id: "left", type: "text", text: "Left column" },
              { id: "right", type: "list", items: ["One", "Two"], step: 1 },
            ],
          },
        ],
      },
    },
    {
      id: "s2",
      title: "Second",
      content: {
        id: "body2",
        type: "canvas",
        children: [
          {
            id: "shape",
            type: "shape",
            geometry: "ellipse",
            fill: "#5B5BD6",
            frame: { x: 20, y: 30, width: 100, height: 100 },
          },
        ],
      },
    },
  ],
};
/** Start a validated runtime through the public API. */
export function testDeck(engine = testEngine()) {
  return unwrap(createDeck(inputDeck, { engine }));
}
