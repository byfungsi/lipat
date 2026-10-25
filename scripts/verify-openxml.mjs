import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createLipat, createDeck } from "../packages/lipat/dist/index.js";
const unwrap = (result) => {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};
const engine = unwrap(
  createLipat(new Uint8Array(readFileSync("packages/wasm/lipat.wasm"))),
);
const fixture = unwrap(
  engine.parsePptx(
    new Uint8Array(readFileSync("tests/fixtures/python-pptx.pptx")),
  ),
);
const asset = fixture.scene.assets[0];
if (!asset) throw new Error("Independent raster fixture missing");
const effects = ["fade", "rise", "slide", "zoom"];
const input = {
  id: "native-animation-fixture",
  title: "Native image and animation verification",
  assets: [asset],
  slides: [
    {
      id: "entrances",
      title: "Native entrances",
      content: {
        id: "entrances-canvas",
        type: "canvas",
        children: [
          {
            id: "title",
            type: "heading",
            text: "Native PowerPoint entrances",
            frame: { x: 45, y: 40, width: 850, height: 70 },
            style: { fontSize: 40 },
          },
          ...effects.map((effect, index) => ({
            id: `effect-${effect}`,
            type: "text",
            text: `${index + 1}. ${effect}`,
            style: { fontSize: 30 },
            frame: { x: 50 + index * 220, y: 190, width: 190, height: 90 },
            step: index + 1,
            animation: {
              effect,
              durationMs: 1500,
              delayMs: 100,
              easing: "linear",
            },
          })),
        ],
      },
    },
    {
      id: "objects",
      title: "Different targets and timing",
      content: {
        id: "objects-canvas",
        type: "canvas",
        children: [
          {
            id: "auto",
            type: "text",
            text: "Automatic on slide entry",
            frame: { x: 20, y: 20, width: 800, height: 80 },
            animation: {
              effect: "fade",
              durationMs: 1200,
              delayMs: 200,
              easing: "easeOut",
            },
          },
          {
            id: "image",
            type: "image",
            assetId: asset.id,
            fit: "cover",
            frame: { x: 40, y: 180, width: 180, height: 140 },
            step: 1,
            animation: {
              effect: "zoom",
              durationMs: 1000,
              easing: "easeInOut",
            },
          },
          {
            id: "rotated",
            type: "shape",
            geometry: "rect",
            fill: "#5B5BD6",
            frame: { x: 300, y: 180, width: 160, height: 120, rotation: 27 },
            step: 1,
            animation: {
              effect: "rise",
              durationMs: 1000,
              delayMs: 300,
              easing: "linear",
            },
          },
          {
            id: "table",
            type: "table",
            columns: ["A", "B"],
            rows: [["1", "2"]],
            frame: { x: 550, y: 170, width: 250, height: 160 },
            step: 3,
            animation: { effect: "slide", durationMs: 600, easing: "linear" },
          },
        ],
      },
    },
  ],
};
mkdirSync("artifacts", { recursive: true });
const deck = unwrap(createDeck(input, { engine }));
const scene = unwrap(deck.compile()).scene;
const animated = unwrap(engine.writePptx(scene));
writeFileSync("artifacts/openxml-animations.pptx", animated.bytes);
writeFileSync(
  "artifacts/openxml-animation-source.json",
  JSON.stringify(deck.exportDocument(), null, 2),
);
const linked = unwrap(
  createDeck(
    {
      id: "linked",
      slides: [
        {
          id: "s",
          content: {
            id: "photo",
            type: "image",
            url: "https://example.com/image.png?size=2&crop=1",
            alt: "Linked image",
            frame: { x: 20, y: 20, width: 500, height: 300 },
            animation: { effect: "fade", easing: "linear" },
          },
        },
      ],
    },
    { engine },
  ),
);
writeFileSync(
  "artifacts/openxml-linked-images.pptx",
  unwrap(engine.writePptx(unwrap(linked.compile()).scene)).bytes,
);
execFileSync(
  process.env.LIPAT_DOTNET ?? "dotnet",
  [
    "run",
    "--project",
    "tools/pptx-validator/PptxValidator.csproj",
    "--",
    "artifacts/openxml-animations.pptx",
    "artifacts/openxml-linked-images.pptx",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DOTNET_CLI_TELEMETRY_OPTOUT: "1",
      DOTNET_SKIP_FIRST_TIME_EXPERIENCE: "1",
    },
  },
);
