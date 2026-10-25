import { encodeAssetBytes } from "@lipat-internal/model";
import type {
  DeckAsset,
  DeckDocument,
  ImageSource,
  LipatEngine,
  LipatResult,
  SlideNode,
  SlideScene,
} from "@lipat-internal/model";

/** Loaded raster bytes cross the host boundary; no URL credentials or fetch implementation enter documents. */
export interface LoadedImage {
  readonly bytes: Uint8Array;
  readonly mimeType: DeckAsset["mimeType"];
  readonly width?: number;
  readonly height?: number;
}
/** Explicit network capability; each distinct URL is requested once per embedding operation. */
export interface ImageLoader {
  load(url: string): Promise<LipatResult<LoadedImage>>;
}
/** Minimal portable fetch response, structurally compatible with browser and Node Response. */
export interface ImageFetchResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly headers: { get(name: string): string | null };
  readonly body?: {
    getReader(): {
      read(): Promise<{
        readonly done: boolean;
        readonly value?: Uint8Array | undefined;
      }>;
      cancel(): Promise<void>;
      releaseLock(): void;
    };
  } | null;
  arrayBuffer(): Promise<ArrayBuffer>;
}
/** Pass fetch explicitly, or wrap it to supply host-specific URL, authentication or cancellation policy. */
export type ImageFetch = (
  url: string,
  options: { readonly credentials: "omit"; readonly redirect: "follow" },
) => Promise<ImageFetchResponse>;

function failed(reason: string, message: string): LipatResult<never> {
  return { ok: false, error: { reason, message } };
}
async function discardImageResponse(
  response: ImageFetchResponse,
): Promise<void> {
  if (!response.body) return;
  const reader = response.body.getReader();
  try {
    await reader.cancel();
  } catch {
    /* Cleanup failure must not replace the original HTTP or byte-limit error. */
  } finally {
    reader.releaseLock();
  }
}

function rasterType(bytes: Uint8Array): DeckAsset["mimeType"] | undefined {
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value))
    return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "image/jpeg";
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));
  if (["GIF87a", "GIF89a"].includes(ascii(0, 6))) return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return undefined;
}

/** Build a bounded raster-image loader around an explicit fetch capability; errors remain Result values. */
export function createImageLoader(
  fetchImage: ImageFetch,
  options: { readonly maxBytes?: number } = {},
): ImageLoader {
  const max = options.maxBytes ?? 16 * 1024 * 1024;
  return {
    async load(url) {
      if (!Number.isSafeInteger(max) || max <= 0 || max > 64 * 1024 * 1024)
        return failed(
          "invalidImageOptions",
          "Image byte limit must be a positive integer up to 64 MiB",
        );
      if (!/^https?:\/\//i.test(url))
        return failed(
          "invalidImageUrl",
          "Image loader requires an absolute HTTP(S) URL",
        );
      try {
        const response = await fetchImage(url, {
          credentials: "omit",
          redirect: "follow",
        });
        if (!response.ok) {
          await discardImageResponse(response);
          return failed(
            "imageFetchFailed",
            `Image request failed with HTTP status ${response.status}`,
          );
        }
        const declared = Number(response.headers.get("content-length"));
        if (Number.isFinite(declared) && declared > max) {
          await discardImageResponse(response);
          return failed(
            "resourceLimit",
            "Remote image exceeds the configured byte limit",
          );
        }
        let bytes: Uint8Array;
        if (response.body) {
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          let length = 0;
          try {
            while (true) {
              const part = await reader.read();
              if (part.done) break;
              if (!part.value) continue;
              length += part.value.byteLength;
              if (length > max) {
                try {
                  await reader.cancel();
                } catch {
                  /* Preserve the byte-limit error if cancellation rejects. */
                }
                return failed(
                  "resourceLimit",
                  "Remote image exceeds the configured byte limit",
                );
              }
              chunks.push(part.value);
            }
          } finally {
            reader.releaseLock();
          }
          bytes = new Uint8Array(length);
          let offset = 0;
          for (const chunk of chunks) {
            bytes.set(chunk, offset);
            offset += chunk.byteLength;
          }
        } else {
          bytes = new Uint8Array(await response.arrayBuffer());
          if (bytes.byteLength > max)
            return failed(
              "resourceLimit",
              "Remote image exceeds the configured byte limit",
            );
        }
        const mimeType = rasterType(bytes);
        if (!mimeType)
          return failed(
            "unsupportedImage",
            "Remote image must contain PNG, JPEG, GIF or WebP raster bytes",
          );
        return { ok: true, value: { bytes, mimeType } };
      } catch {
        return failed(
          "imageFetchFailed",
          "Image request failed; check the URL, network access and browser CORS policy",
        );
      }
    },
  };
}

async function resolveSources(
  sources: readonly { readonly id: string; readonly url: string }[],
  assets: readonly DeckAsset[],
  loader: ImageLoader,
): Promise<
  LipatResult<{
    readonly assets: readonly DeckAsset[];
    readonly ids: ReadonlyMap<string, string>;
  }>
> {
  const next = [...assets];
  const used = new Set(assets.map((asset) => asset.id));
  const ids = new Map<string, string>();
  let counter = 0;
  let total = assets.reduce(
    (sum, asset) =>
      sum +
      Math.floor((asset.data.length * 3) / 4) -
      (asset.data.endsWith("==") ? 2 : asset.data.endsWith("=") ? 1 : 0),
    0,
  );
  for (const source of sources) {
    if (ids.has(source.url)) continue;
    let loaded: LipatResult<LoadedImage>;
    try {
      loaded = await loader.load(source.url);
    } catch {
      loaded = failed("imageFetchFailed", "Image loader rejected the request");
    }
    if (!loaded.ok)
      return { ok: false, error: { ...loaded.error, nodeId: source.id } };
    total += loaded.value.bytes.byteLength;
    if (total > 64 * 1024 * 1024)
      return {
        ok: false,
        error: {
          reason: "resourceLimit",
          message: "Embedded images exceed 64 MiB",
          nodeId: source.id,
        },
      };
    let id: string;
    do {
      id = `url-image-${++counter}`;
    } while (used.has(id));
    used.add(id);
    ids.set(source.url, id);
    next.push({
      id,
      mimeType: loaded.value.mimeType,
      data: encodeAssetBytes(loaded.value.bytes),
      ...(loaded.value.width !== undefined
        ? { width: loaded.value.width }
        : {}),
      ...(loaded.value.height !== undefined
        ? { height: loaded.value.height }
        : {}),
    });
  }
  return { ok: true, value: { assets: next, ids } };
}
function embeddedSource(
  url: string,
  ids: ReadonlyMap<string, string>,
): ImageSource {
  const assetId = ids.get(url);
  if (assetId === undefined)
    throw new Error("Resolved image asset identity is missing");
  return { assetId };
}

/** Resolve URL images into a new validated source document; a failed fetch never mutates its input or runtime. */
export async function embedDocumentImages(
  document: DeckDocument,
  options: { readonly engine: LipatEngine; readonly loader: ImageLoader },
): Promise<LipatResult<DeckDocument>> {
  const parsed = options.engine.parseDocument(document);
  if (!parsed.ok) return parsed;
  const sources: { id: string; url: string }[] = [];
  const collect = (node: SlideNode): void => {
    if (node.type === "image" && node.url !== undefined)
      sources.push({ id: node.id, url: node.url });
    if ("children" in node) node.children.forEach(collect);
  };
  parsed.value.slides.forEach((slide) => collect(slide.content));
  const resolved = await resolveSources(
    sources,
    parsed.value.assets,
    options.loader,
  );
  if (!resolved.ok) return resolved;
  const replace = (node: SlideNode): SlideNode => {
    if (node.type === "image" && node.url !== undefined) {
      const { url, ...rest } = node;
      return { ...rest, ...embeddedSource(url, resolved.value.ids) };
    }
    return "children" in node
      ? { ...node, children: node.children.map(replace) }
      : node;
  };
  return options.engine.parseDocument({
    ...parsed.value,
    assets: resolved.value.assets,
    slides: parsed.value.slides.map((slide) => ({
      ...slide,
      content: replace(slide.content),
    })),
  });
}

/** Resolve remote images without recompiling scene geometry or text; use before offline PPTX/HTML export. */
export async function embedSceneImages(
  scene: SlideScene,
  options: { readonly engine: LipatEngine; readonly loader: ImageLoader },
): Promise<LipatResult<SlideScene>> {
  const checked = options.engine.importScene(scene);
  if (!checked.ok) return checked;
  const sources = scene.slides.flatMap((slide) =>
    slide.elements.flatMap((element) =>
      element.type === "image" && element.url !== undefined
        ? [{ id: element.id, url: element.url }]
        : [],
    ),
  );
  const resolved = await resolveSources(sources, scene.assets, options.loader);
  if (!resolved.ok) return resolved;
  const embedded: SlideScene = {
    ...scene,
    assets: resolved.value.assets,
    slides: scene.slides.map((slide) => ({
      ...slide,
      elements: slide.elements.map((element) => {
        if (element.type !== "image" || element.url === undefined)
          return element;
        const { url, ...rest } = element;
        return { ...rest, ...embeddedSource(url, resolved.value.ids) };
      }),
    })),
  };
  const valid = options.engine.importScene(embedded);
  return valid.ok ? { ok: true, value: embedded } : valid;
}
