import module from "./lipat.wasm";
import { createLipatFromModule, createLipat } from "@byfungsi/lipat";
import { createSvgAsset } from "@byfungsi/lipat/images";
import { decodeAssetBytes } from "@byfungsi/lipat/model";
export default {
  async fetch() {
    const initialized = createLipatFromModule(module, {
      limits: {
        maxNodes: 20,
        maxSceneElements: 10,
        maxPptxBytes: 1024 * 1024,
        maxExpandedBytes: 4 * 1024 * 1024,
        maxLayoutWork: 10000,
      },
    });
    if (!initialized.ok) return Response.json(initialized, { status: 500 });
    const engine = initialized.value;
    const document = engine.parseDocument({
      id: "worker",
      assets: [
        createSvgAsset({
          id: "mark",
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><rect width="80" height="40" rx="8" fill="#5856D6"/></svg>',
        }),
      ],
      slides: [
        {
          id: "s",
          content: {
            id: "canvas",
            type: "canvas",
            children: [
              {
                id: "heading",
                type: "heading",
                text: "Precompiled Worker WASM",
                animation: { effect: "fade" },
                frame: { x: 30, y: 30, width: 880, height: 80 },
              },
              {
                id: "chart",
                type: "chart",
                chart: {
                  kind: "column",
                  categories: ["A", "B"],
                  series: [{ name: "Sample", values: [12, 24] }],
                },
                frame: { x: 30, y: 130, width: 700, height: 350 },
              },
              {
                id: "mark-node",
                type: "image",
                assetId: "mark",
                frame: { x: 780, y: 160, width: 120, height: 60 },
              },
            ],
          },
        },
      ],
    });
    if (!document.ok) return Response.json(document, { status: 500 });
    const compiled = engine.compile(document.value);
    if (!compiled.ok) return Response.json(compiled, { status: 500 });
    const exported = engine.writePptx(compiled.value.scene);
    if (!exported.ok) return Response.json(exported, { status: 500 });
    const imported = engine.parsePptx(exported.value.bytes);
    if (!imported.ok) return Response.json(imported, { status: 500 });
    // An empty valid module proves byte compilation is denied by this runtime, independently of Lipat's ABI.
    const byteInitializer = createLipat(decodeAssetBytes("AGFzbQEAAAA="));
    const restricted = createLipatFromModule(module, {
      limits: { maxTextBytes: 4 },
    });
    if (!restricted.ok) return Response.json(restricted, { status: 500 });
    const denied = restricted.value.parseDocument({
      id: "denied",
      slides: [
        { id: "s", content: { id: "text", type: "text", text: "Too long" } },
      ],
    });
    return Response.json({
      scene: imported.value.scene,
      byteInitializer,
      denied,
    });
  },
};
