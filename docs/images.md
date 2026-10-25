# Image URLs and embedded assets

Available in **0.3.0**. Image nodes accept exactly one source: an embedded `assetId` or an absolute HTTP(S) `url`. URL sources work in semantic creation, Markdown, agent operations, scenes, SVG, React, HTML and reveal.js. The Rust/WASM core never fetches a URL.

```ts
const image = {
  id: "cover-photo",
  type: "image",
  url: "https://example.com/photo.png",
  alt: "A mountain at sunrise",
  fit: "cover",
  frame: { x: 80, y: 120, width: 640, height: 360 },
  step: 1,
  animation: { effect: "fade", durationMs: 400 },
} as const;
```

Use a direct image endpoint, rather than a web page containing an image. URLs with credentials, whitespace, unsupported protocols or more than 8192 characters are rejected. Relative URLs must be resolved by the host before authoring. Browser previews load the image through SVG `href` and follow normal browser loading/CSP policy.

Markdown accepts standalone `![alt](https://example.com/photo.png)` and existing `![alt](asset:asset-id)` syntax. Agents can replace the source without changing geometry, alt text, fit or animation:

```ts
deck.apply([
  {
    type: "setImageSource",
    nodeId: "cover-photo",
    source: { url: "https://example.com/replacement.png" },
  },
]);
```

The operation also accepts `{assetId: "existing-asset"}`. It participates in atomic validation, revision checks and undo/redo. `deck.inspect()` includes each image's source.

## Offline PPTX and HTML

The optional `/images` module owns asynchronous resolution. Pass a loader explicitly; importing the library or compiling a deck never causes a request.

```ts
import { writePptxWithImages } from "@byfungsi/lipat/pptx";
import { createImageLoader } from "@byfungsi/lipat/images";

const compiled = deck.compile();
if (compiled.ok) {
  const result = await writePptxWithImages(compiled.value.scene, {
    engine,
    loader: createImageLoader(fetch),
  });
  if (result.ok) {
    // Save or deliver result.value.bytes through your host.
  }
}
```

`embedDocumentImages(document, {engine, loader})` returns a new source document with URL nodes replaced by embedded assets. Resolve before compilation when intrinsic dimensions should affect flow layout. `embedSceneImages(scene, {engine, loader})` preserves resolved scene geometry and text and returns an embedded scene suitable for `renderDeckHtml` or PPTX export. With embedded assets, HTML and PPTX need no image-network access.

Each distinct URL is loaded once per call. New asset IDs avoid collisions with existing assets. Failed fetches return a Result with the affected `nodeId`; partial assets and source/history mutations are never committed. A custom `ImageLoader` can implement host caching, authorization, URL access policy or alternate storage without changing the core.

`createImageLoader(fetch, {maxBytes?})` supports PNG, JPEG, GIF and WebP raster bytes. The default limit is 16 MiB per image, configurable up to 64 MiB; declared and streamed byte counts are checked. The document's 64 MiB aggregate asset limit also applies. Requests omit credentials and follow redirects. Browser embedding requires the image server to allow CORS. HTTP failures, non-raster responses and network/CORS failures return errors; no image proxy is bundled. External PowerPoint clients vary in WebP support.

## Linked PPTX images

The synchronous `engine.writePptx(scene)` preserves URL sources as external image relationships and returns `linkedImageExport` diagnostics. This path performs no fetch and depends on the receiving application's external-image policy and network access. Unknown intrinsic dimensions may flatten contain/cover behavior with an `imageFitFlattened` warning. Use the asynchronous embedding path for reliable offline delivery and intrinsic-dimension cropping.

`parsePptx` retains supported external HTTP(S) image relationships as URL nodes, with `linkedImage` diagnostics, without fetching them. The synchronous agent export tool uses this linked behavior; a host can call the asynchronous helper before delivering an offline file.

[Try the image sample](./playground/index.html?sample=images). The playground's PPTX and HTML downloads use the embedding path and report browser fetch/CORS failures.
