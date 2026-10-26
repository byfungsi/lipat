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

`createImageLoader(fetch, {maxBytes?})` supports PNG, JPEG, GIF, WebP and static SVG bytes. The default limit is 16 MiB per image, configurable up to 64 MiB; declared and streamed byte counts are checked. The document's 64 MiB aggregate asset limit also applies. Requests omit credentials and follow redirects. Browser embedding requires the image server to allow CORS. HTTP failures, unsupported responses and network/CORS failures return errors; no image proxy is bundled. SVG profile validation occurs when the loaded asset enters the engine. External PowerPoint clients vary in WebP support.

## SVG image assets

SVG support is an unreleased addition after 0.6.0. Use an ordinary image node referencing an SVG asset:

```ts
import { createSvgAsset } from "@byfungsi/lipat/images";

const asset = createSvgAsset({
  id: "brand-mark",
  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#5856D6"/></svg>',
});
const image = {
  id: "logo",
  type: "image" as const,
  assetId: asset.id,
  alt: "Purple circular brand mark",
  fit: "contain" as const,
};
// Add asset to DeckInput.assets and image to a slide, then admit through the engine.
```

`createSvgAsset` only encodes UTF-8/base64; engine admission validates the XML. Direct assets with `mimeType: 'image/svg+xml'` use the same contract. The image editor accepts `.svg` uploads through its normal image pipeline. Host image resolvers may return SVG bytes as well.

The static profile supports `svg`, `g`, `defs`, `path`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `linearGradient`, `radialGradient`, `stop`, `clipPath`, `mask`, `title`, `desc`, `text` and `tspan`. Presentation attributes and a bounded list of inline style properties are accepted. Paint and clipping references must be local `url(#id)` values. The root requires the SVG namespace and a positive intrinsic size or `viewBox`. Intrinsic dimensions participate in contain/cover layout.

Scripts, event handlers, `foreignObject`, CSS stylesheets, nested images, `use`, animation, DTDs and external references are rejected. SVG XML has a hard ceiling of 1 MiB, 16,000 XML nodes and 32 element levels; host XML limits may lower these bounds. Scene-only renderers independently reparse SVG, escape its text/attributes and scope IDs per image instance. `embedded-only` therefore permits admitted static SVG without allowing it to fetch external resources.

PPTX export includes the original SVG through Microsoft's `asvg:svgBlip` extension and an automatically rendered PNG compatibility fallback. Rendering uses resvg in the shared native/WASM core, with no system font discovery or file/network access. The fallback has at most 2,048 pixels per edge and is subject to asset/package limits. SVG text requests are retained in the vector, while fallback PNG text uses bundled OFL Lato when the requested font is unavailable; `svgFallbackFont` reports this difference. Convert important logo lettering to paths for exact artwork fidelity. The font's license ships with the SDK.

Import prefers supported embedded SVG. If a vector is outside the profile and a conventional raster fallback is present, the parser imports that fallback and reports `svgRasterFallback`. An unsupported SVG without a usable fallback cannot be admitted as a safe vector. Linked image URLs remain host-controlled sources; embed them before offline export.

## Linked PPTX images

The synchronous `engine.writePptx(scene)` preserves URL sources as external image relationships and returns `linkedImageExport` diagnostics. This path performs no fetch and depends on the receiving application's external-image policy and network access. Unknown intrinsic dimensions may flatten contain/cover behavior with an `imageFitFlattened` warning. Use the asynchronous embedding path for reliable offline delivery and intrinsic-dimension cropping.

`parsePptx` retains supported external HTTP(S) image relationships as URL nodes, with `linkedImage` diagnostics, without fetching them. The synchronous agent export tool uses this linked behavior; a host can call the asynchronous helper before delivering an offline file.

[Try the image sample](./playground/index.html?sample=images). The playground's PPTX and HTML downloads use the embedding path and report browser fetch/CORS failures.
