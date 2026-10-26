import { encodeAssetBytes } from "@lipat-internal/model";
import type { DeckAsset } from "@lipat-internal/model";

/** Encode an SVG string as an image asset without DOM APIs; the engine validates its static vector profile on admission. */
export function createSvgAsset(input: {
  readonly id: string;
  readonly svg: string;
}): DeckAsset {
  const bytes: number[] = [];
  for (const character of input.svg) {
    let point = character.codePointAt(0) ?? 0xfffd;
    if (point >= 0xd800 && point <= 0xdfff) point = 0xfffd;
    if (point < 0x80) bytes.push(point);
    else if (point < 0x800)
      bytes.push(0xc0 | (point >> 6), 0x80 | (point & 63));
    else if (point < 0x10000)
      bytes.push(
        0xe0 | (point >> 12),
        0x80 | ((point >> 6) & 63),
        0x80 | (point & 63),
      );
    else
      bytes.push(
        0xf0 | (point >> 18),
        0x80 | ((point >> 12) & 63),
        0x80 | ((point >> 6) & 63),
        0x80 | (point & 63),
      );
  }
  return {
    id: input.id,
    mimeType: "image/svg+xml",
    data: encodeAssetBytes(new Uint8Array(bytes)),
  };
}
