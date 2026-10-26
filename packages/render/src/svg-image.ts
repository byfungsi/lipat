import { SaxesParser } from "saxes";
import { decodeAssetBytes } from "@lipat-internal/model";
import type { DeckAsset, ElementFrame } from "@lipat-internal/model";
import { escapeSlideMarkup } from "./markup-escape";

const elements = new Set(
  "svg g defs path rect circle ellipse line polyline polygon linearGradient radialGradient stop clipPath mask title desc text tspan".split(
    " ",
  ),
);
const attributes = new Set(
  "id viewBox width height x y x1 y1 x2 y2 cx cy r rx ry d points transform gradientTransform gradientUnits spreadMethod offset stop-color stop-opacity fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity clip-path clip-rule clipPathUnits mask maskUnits maskContentUnits preserveAspectRatio font-family font-size font-weight font-style text-anchor dominant-baseline letter-spacing dx dy color vector-effect".split(
    " ",
  ),
);
const styles = new Set(
  "fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity stop-color stop-opacity font-family font-size font-weight font-style text-anchor letter-spacing color".split(
    " ",
  ),
);
const svgNamespace = "http://www.w3.org/2000/svg";
function svgContentId(source: string): string {
  let hash = 2166136261;
  for (let index = 0; index < source.length; index++)
    hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16);
}
function svgLength(value: string | undefined): number {
  if (!value) return NaN;
  const match =
    /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*(px|pt|pc|in|cm|mm)?\s*$/.exec(
      value,
    );
  if (!match) return NaN;
  const units: Readonly<Record<string, number>> = {
    px: 1,
    pt: 96 / 72,
    pc: 16,
    in: 96,
    cm: 96 / 2.54,
    mm: 96 / 25.4,
  };
  return Number(match[1]) * (units[match[2] ?? "px"] ?? 1);
}
function safeValue(value: string): boolean {
  if (/[\\<>@:]/.test(value)) return false;
  return !/url/i.test(value) || /^url\(#[a-zA-Z0-9_.-]+\)$/.test(value.trim());
}

/** Reparse SVG assets at the scene-only rendering boundary; emit only a static, scoped SVG subtree. */
export function renderEmbeddedSvg(
  asset: DeckAsset,
  frame: ElementFrame,
  fit: string,
  alt: string,
  scope: string,
): string {
  if (
    asset.data.length > 1_398_104 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(asset.data) ||
    asset.data.length % 4 !== 0
  )
    return "";
  try {
    const bytes = decodeAssetBytes(asset.data);
    const source = decodeURIComponent(
      Array.from(bytes, (b) => `%${b.toString(16).padStart(2, "0")}`).join(""),
    );
    const parser = new SaxesParser({ xmlns: true });
    let viewport:
      { readonly width: number; readonly height: number } | undefined;
    let depth = 0,
      nodes = 0,
      valid = true,
      output = "";
    const ids = new Set<string>();
    const prefix = `svg-${Array.from(scope)
      .map((c) => c.codePointAt(0)?.toString(16))
      .join("-")}-${svgContentId(source)}-`;
    const scoped = (value: string) =>
      value.replace(
        /url\(#([a-zA-Z0-9_.-]+)\)/g,
        (_, id: string) => `url(#${prefix}${id})`,
      );
    parser.on("error", () => {
      valid = false;
    });
    parser.on("doctype", () => {
      valid = false;
    });
    parser.on("processinginstruction", () => {
      valid = false;
    });
    parser.on("opentag", (tag) => {
      if (!valid) return;
      nodes++;
      depth++;
      if (
        nodes > 16000 ||
        depth > 32 ||
        tag.uri !== svgNamespace ||
        !elements.has(tag.local) ||
        (depth === 1 && tag.local !== "svg")
      ) {
        valid = false;
        return;
      }
      let attrs = "";
      for (const attr of Object.values(tag.attributes)) {
        if (attr.uri === "http://www.w3.org/2000/xmlns/") continue;
        if (
          attr.uri === "http://www.w3.org/XML/1998/namespace" &&
          attr.local === "space"
        ) {
          attrs += ` xml:space="${escapeSlideMarkup(attr.value)}"`;
          continue;
        }
        if (attr.uri) {
          valid = false;
          return;
        }
        if (attr.local === "style") {
          for (const property of attr.value
            .split(";")
            .filter((p) => p.trim())) {
            const index = property.indexOf(":"),
              name = property.slice(0, index).trim(),
              value = property.slice(index + 1).trim();
            if (index < 0 || !styles.has(name) || !safeValue(value)) {
              valid = false;
              return;
            }
          }
        } else if (!attributes.has(attr.local) || !safeValue(attr.value)) {
          valid = false;
          return;
        }
        if (attr.local === "id") {
          if (!/^[a-zA-Z0-9_.-]+$/.test(attr.value) || ids.has(attr.value)) {
            valid = false;
            return;
          }
          ids.add(attr.value);
        }
        // The outer image frame owns viewport geometry; retain the asset's viewBox and scoped paint references.
        if (depth === 1 && ["x", "y", "width", "height"].includes(attr.local))
          continue;
        const value =
          attr.local === "id" ? prefix + attr.value : scoped(attr.value);
        attrs += ` ${attr.local}="${escapeSlideMarkup(value)}"`;
      }
      if (depth === 1) {
        const viewBox = tag.attributes.viewBox?.value;
        const dimensions = viewBox
          ?.trim()
          .split(/[\s,]+/)
          .map(Number);
        if (
          dimensions &&
          (dimensions.length !== 4 ||
            dimensions.some((v) => !Number.isFinite(v)) ||
            (dimensions[2] ?? 0) <= 0 ||
            (dimensions[3] ?? 0) <= 0)
        ) {
          valid = false;
          return;
        }
        const parsedWidth = svgLength(tag.attributes.width?.value),
          parsedHeight = svgLength(tag.attributes.height?.value);
        const w = Number.isNaN(parsedWidth)
            ? (dimensions?.[2] ?? NaN)
            : parsedWidth,
          h = Number.isNaN(parsedHeight)
            ? (dimensions?.[3] ?? NaN)
            : parsedHeight;
        if (
          !(w > 0) ||
          !(h > 0) ||
          !Number.isFinite(w) ||
          !Number.isFinite(h) ||
          w > 1e6 ||
          h > 1e6
        ) {
          valid = false;
          return;
        }
        if (!viewBox) attrs += ` viewBox="0 0 ${w} ${h}"`;
        viewport = { width: w, height: h };
        attrs += ` x="0" y="0" width="${w}" height="${h}" overflow="hidden"`;
      }
      output += `<${tag.local}${attrs}>`;
      if (depth === 1) output += `<title>${escapeSlideMarkup(alt)}</title>`;
    });
    parser.on("closetag", (tag) => {
      if (valid) output += `</${tag.local}>`;
      depth--;
    });
    parser.on("text", (text) => {
      if (valid) output += escapeSlideMarkup(text);
    });
    parser.on("cdata", (text) => {
      if (valid) output += escapeSlideMarkup(text);
    });
    parser.write(source).close();
    return valid && depth === 0 && nodes > 0 && viewport
      ? `<svg x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" viewBox="0 0 ${viewport.width} ${viewport.height}" preserveAspectRatio="${fit === "stretch" ? "none" : fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}" overflow="hidden">${output}</svg>`
      : "";
  } catch {
    return "";
  }
}
