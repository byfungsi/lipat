import { afterAll, beforeAll, expect, it } from "vitest";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { createDeck, fromMarkdown } from "@byfungsi/lipat";
import {
  createImageLoader,
  embedDocumentImages,
  embedSceneImages,
} from "@byfungsi/lipat/images";
import { writePptxWithImages } from "@byfungsi/lipat/pptx";
import { decodeAssetBytes } from "@byfungsi/lipat/model";
import { createAgentTools } from "@byfungsi/lipat/agent";
import { renderSlideSvg, renderDeckHtml } from "@byfungsi/lipat/render";
import { testEngine, unwrap } from "./engine-fixture";

const engine = testEngine();
const fixture = unwrap(
  engine.parsePptx(
    new Uint8Array(readFileSync("tests/fixtures/python-pptx.pptx")),
  ),
).scene.assets[0];
if (!fixture) throw new Error("Image fixture missing");
const bytes = decodeAssetBytes(fixture.data);
let origin = "";
let requests = 0;
const server = createServer((request, response) => {
  requests++;
  if (request.url === "/missing") {
    response.writeHead(404);
    response.end();
    return;
  }
  response.setHeader("access-control-allow-origin", "*");
  if (request.url === "/html") {
    response.end("<html>not an image</html>");
    return;
  }
  if (request.url === "/chunked") {
    response.writeHead(200, { "content-type": "image/png" });
    response.write(bytes.slice(0, 20));
    response.end(bytes.slice(20));
    return;
  }
  response.writeHead(200, {
    "content-type": "image/png",
    "content-length": bytes.byteLength,
  });
  response.end(bytes);
});
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Image server missing");
  origin = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
function remoteDeck(url = `${origin}/image.png`) {
  return unwrap(
    createDeck(
      {
        id: "url-deck",
        slides: [
          {
            id: "s",
            content: {
              id: "canvas",
              type: "canvas",
              children: [
                {
                  id: "photo",
                  type: "image",
                  url,
                  alt: "A remote photo",
                  fit: "contain",
                  frame: { x: 0, y: 0, width: 100, height: 100 },
                },
                {
                  id: "copy",
                  type: "image",
                  url,
                  alt: "Same photo",
                  fit: "cover",
                  frame: { x: 200, y: 0, width: 100, height: 100 },
                },
              ],
            },
          },
        ],
      },
      { engine },
    ),
  );
}
it("validates, edits and renders direct URL sources without fetching or losing image properties", () => {
  const before = requests;
  const deck = remoteDeck(`${origin}/image.png?crop=1&size=2`);
  const scene = unwrap(deck.compile()).scene;
  expect(scene.slides[0]?.elements[0]).toMatchObject({
    url: `${origin}/image.png?crop=1&size=2`,
    fit: "contain",
  });
  expect(renderSlideSvg(scene, "s")).toContain(
    `href="${origin}/image.png?crop=1&amp;size=2"`,
  );
  expect(renderDeckHtml(scene)).toContain(
    `${origin}/image.png?crop=1&amp;size=2`,
  );
  expect(requests).toBe(before);
  const tools = createAgentTools(deck, { engine });
  expect(
    tools.execute("lipat_apply", {
      expectedRevision: 0,
      operations: [
        {
          type: "setImageSource",
          nodeId: "photo",
          source: { url: `${origin}/different.png` },
        },
      ],
    }).ok,
  ).toBe(true);
  expect(
    deck.inspect().slides[0]?.nodes.find((node) => node.id === "photo")?.image,
  ).toEqual({ url: `${origin}/different.png` });
  expect(unwrap(deck.compile()).scene.slides[0]?.elements[0]).toMatchObject({
    alt: "A remote photo",
    frame: { width: 100, height: 100 },
  });
  deck.undo();
  expect(unwrap(deck.compile()).scene.slides[0]?.elements[0]).toMatchObject({
    url: `${origin}/image.png?crop=1&size=2`,
  });
});
it("accepts URL image Markdown next to paragraphs and retains embedded asset syntax", () => {
  const source = unwrap(
    fromMarkdown(
      `# Photos\nA caption\n![Remote](${origin}/photo_(1).png?x=1&y=2)\n![Embedded](asset:${fixture.id})`,
      { id: "md", assets: [fixture] },
    ),
  );
  const deck = unwrap(createDeck(source, { engine }));
  expect(
    unwrap(deck.compile()).scene.slides[0]?.elements.filter(
      (e) => e.type === "image",
    ),
  ).toMatchObject([
    { url: `${origin}/photo_(1).png?x=1&y=2`, alt: "Remote" },
    { assetId: fixture.id, alt: "Embedded" },
  ]);
  expect(fromMarkdown("![Bad](javascript:alert(1))", { id: "bad" }).ok).toBe(
    false,
  );
});
it("rejects invalid or ambiguous image sources before fetching, including credentials and executable protocols", () => {
  const original = remoteDeck().exportDocument();
  for (const source of [
    { url: "javascript:alert(1)" },
    { url: "file:///tmp/image.png" },
    { url: "/relative.png" },
    { url: "https://user:password@example.com/p.png" },
    { url: "https://example.com/a b.png" },
    { url: `${origin}/image.png`, assetId: fixture.id },
    {},
  ]) {
    const candidate = {
      ...original,
      slides: [{ id: "s", content: { id: "bad", type: "image", ...source } }],
    };
    expect(engine.parseDocument(candidate).ok).toBe(false);
  }
});
it("writes and parses linked URL images without a network request", () => {
  const deck = remoteDeck();
  const before = requests;
  const output = unwrap(engine.writePptx(unwrap(deck.compile()).scene));
  expect(output.diagnostics.some((d) => d.code === "linkedImageExport")).toBe(
    true,
  );
  const imported = unwrap(engine.parsePptx(output.bytes));
  expect(imported.scene.slides[0]?.elements[0]).toMatchObject({
    type: "image",
    url: `${origin}/image.png`,
    alt: "A remote photo",
  });
  expect(imported.scene.assets).toHaveLength(0);
  expect(requests).toBe(before);
});
it("embeds each unique URL once, preserves source/history and exports offline images with correct fit", async () => {
  const deck = remoteDeck();
  const source = deck.exportDocument();
  const before = requests;
  const embedded = unwrap(
    await embedDocumentImages(source, {
      engine,
      loader: createImageLoader(fetch),
    }),
  );
  expect(requests - before).toBe(1);
  expect(embedded.assets).toHaveLength(1);
  expect(deck.exportDocument()).toBe(source);
  expect(deck.getState().revision).toBe(0);
  const compiled = unwrap(engine.compile(embedded)).scene;
  expect(compiled.slides[0]?.elements[0]).toMatchObject({
    assetId: embedded.assets[0]?.id,
    frame: { width: 100, height: 50 },
  });
  const scene = unwrap(deck.compile()).scene;
  const output = unwrap(
    await writePptxWithImages(scene, {
      engine,
      loader: createImageLoader(fetch),
    }),
  );
  expect(output.diagnostics).toEqual([]);
  const parsed = unwrap(engine.parsePptx(output.bytes));
  expect(parsed.scene.assets[0]?.data).toBe(fixture.data);
  expect(parsed.scene.slides[0]?.elements[0]).toMatchObject({
    type: "image",
    frame: { width: 100, height: 50 },
  });
  expect(scene.assets).toHaveLength(0);
});
it("returns useful fetch errors and enforces declared and streaming limits without a partial mutation", async () => {
  const loader = createImageLoader(fetch);
  expect(await loader.load(`${origin}/missing`)).toMatchObject({
    ok: false,
    error: { reason: "imageFetchFailed" },
  });
  expect(await loader.load(`${origin}/html`)).toMatchObject({
    ok: false,
    error: { reason: "unsupportedImage" },
  });
  for (const path of ["/image.png", "/chunked"])
    expect(
      await createImageLoader(fetch, { maxBytes: 16 }).load(origin + path),
    ).toMatchObject({ ok: false, error: { reason: "resourceLimit" } });
  const deck = remoteDeck(`${origin}/missing`);
  const scene = unwrap(deck.compile()).scene;
  expect(await embedSceneImages(scene, { engine, loader })).toMatchObject({
    ok: false,
    error: { nodeId: "photo", reason: "imageFetchFailed" },
  });
  expect(deck.getState().revision).toBe(0);
  expect(scene.assets).toHaveLength(0);
});
