import module from "./lipat.wasm";
import { createLipatFromModule, createLipat } from "@byfungsi/lipat";
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
      slides: [
        {
          id: "s",
          content: {
            id: "heading",
            type: "heading",
            text: "Precompiled Worker WASM",
            animation: { effect: "fade" },
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
