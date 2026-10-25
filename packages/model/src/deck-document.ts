/** Failures are data across native, WebAssembly, editing and file boundaries. */
export interface LipatError {
  readonly reason: string;
  readonly message: string;
  readonly nodeId?: string;
}
/** Result convention matches Nori; expected errors do not throw. */
export type LipatResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: LipatError };
/** Coordinates use points (72 per inch); rotation is clockwise degrees. */
export interface ElementFrame {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation?: number;
}
/** Slide dimensions use the same coordinate space as element frames. */
export interface SlideSize {
  readonly width: number;
  readonly height: number;
}
/** Themes provide deterministic document defaults independent of application CSS. */
export interface DeckTheme {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly headingSize: number;
  readonly foreground: string;
  readonly background: string;
  readonly accent: string;
  readonly padding: number;
  readonly gap: number;
}
/** Text colors are #RRGGBB; font sizes use points. */
export interface TextStyle {
  readonly fontFamily?: string;
  readonly fontSize?: number;
  readonly color?: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly align?: "left" | "center" | "right" | "justify";
}
/** Rich text is portable document data, with no HTML or executable markup. */
export interface TextRun {
  readonly text: string;
  readonly style?: TextStyle;
}
/** Agents can use plain strings or explicit rich text runs. */
export type TextContent = string | readonly TextRun[];
/** Stable node IDs are unique across a deck, so edits survive reordering. */
export interface NodeBase {
  readonly id: string;
  readonly frame?: ElementFrame;
  readonly style?: TextStyle;
  readonly step?: number;
}
/** Containers express layout intent; only canvas children require explicit frames. */
export type SlideNode = NodeBase &
  (
    | {
        readonly type: "heading";
        readonly text: TextContent;
        readonly level?: number;
      }
    | { readonly type: "text"; readonly text: TextContent }
    | {
        readonly type: "list";
        readonly items: readonly string[];
        readonly ordered?: boolean;
      }
    | {
        readonly type: "image";
        readonly assetId: string;
        readonly alt?: string;
        readonly fit?: "contain" | "cover" | "stretch";
      }
    | {
        readonly type: "shape";
        readonly geometry?: "rect" | "roundRect" | "ellipse" | "line";
        readonly fill?: string | null;
        readonly stroke?: string | null;
      }
    | {
        readonly type: "table";
        readonly columns: readonly string[];
        readonly rows: readonly (readonly string[])[];
      }
    | {
        readonly type: "code";
        readonly text: string;
        readonly language?: string;
      }
    | {
        readonly type: "stack" | "row";
        readonly gap?: number;
        readonly children: readonly SlideNode[];
      }
    | {
        readonly type: "grid";
        readonly columns: number;
        readonly gap?: number;
        readonly children: readonly SlideNode[];
      }
    | { readonly type: "canvas"; readonly children: readonly SlideNode[] }
  );
/** Binary images are embedded as base64; optional intrinsic dimensions help layout. */
export interface DeckAsset {
  readonly id: string;
  readonly mimeType: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
  readonly data: string;
  readonly width?: number;
  readonly height?: number;
}
/** A parentId creates a vertical slide under an earlier top-level slide. */
export interface DeckSlide {
  readonly id: string;
  readonly title?: string;
  readonly content: SlideNode;
  readonly notes?: string;
  readonly hidden?: boolean;
  readonly background?: string;
  readonly parentId?: string;
}
/** Authoring source: semantic content and layout intent, rather than source PPTX XML. */
export interface DeckDocument {
  readonly version: 1;
  readonly id: string;
  readonly title: string;
  readonly size: SlideSize;
  readonly theme: DeckTheme;
  readonly assets: readonly DeckAsset[];
  readonly slides: readonly DeckSlide[];
}
/** Convenient creation input; native validation supplies omitted defaults. */
export interface DeckInput {
  readonly id: string;
  readonly version?: 1;
  readonly title?: string;
  readonly size?: SlideSize;
  readonly theme?: DeckTheme;
  readonly assets?: readonly DeckAsset[];
  readonly slides: readonly DeckSlide[];
}
/** Renderable primitives are resolved once for preview and file export. */
export type SceneElement = {
  readonly id: string;
  readonly frame: ElementFrame;
  readonly style: TextStyle;
  readonly step?: number;
} & (
  | {
      readonly type: "text";
      readonly text: string;
      readonly runs: readonly TextRun[];
      readonly lines: readonly string[];
      readonly lineHeight: number;
    }
  | {
      readonly type: "shape";
      readonly geometry: "rect" | "roundRect" | "ellipse" | "line";
      readonly fill: string | null;
      readonly stroke: string | null;
    }
  | {
      readonly type: "image";
      readonly assetId: string;
      readonly alt: string;
      readonly fit: "contain" | "cover" | "stretch";
    }
  | {
      readonly type: "table";
      readonly columns: readonly string[];
      readonly rows: readonly (readonly string[])[];
    }
);
/** Resolved slide order and drawing order are explicit arrays. */
export interface SceneSlide {
  readonly id: string;
  readonly title: string;
  readonly notes: string;
  readonly hidden: boolean;
  readonly background: string;
  readonly parentId?: string;
  readonly elements: readonly SceneElement[];
}
/** Output representation shared by renderers and exporters, independent of authoring. */
export interface SlideScene {
  readonly version: 1;
  readonly title: string;
  readonly size: SlideSize;
  readonly assets: readonly DeckAsset[];
  readonly slides: readonly SceneSlide[];
}
/** Diagnostics point agents to the exact slide and node requiring attention. */
export interface DeckDiagnostic {
  readonly code: string;
  readonly severity: "warning" | "error";
  readonly message: string;
  readonly slideId?: string;
  readonly nodeId?: string;
}
/** Approximate default metrics can be replaced by host-measured glyph widths in em units. */
export interface FontMetrics {
  readonly family: string;
  readonly averageWidth: number;
  readonly lineHeight: number;
  readonly glyphWidths?: Readonly<Record<string, number>>;
}
/** Metrics are explicit so browser and native layout can use the same inputs. */
export interface CompileOptions {
  readonly fonts?: readonly FontMetrics[];
}
/** A successful compilation can still contain overflow or compatibility warnings. */
export interface CompileOutput {
  readonly scene: SlideScene;
  readonly diagnostics: readonly DeckDiagnostic[];
}
/** Imported presentations retain source metadata without inventing semantic layouts. */
export interface ImportedPresentation {
  readonly scene: SlideScene;
  readonly diagnostics: readonly DeckDiagnostic[];
  readonly source: {
    readonly format: "pptx";
    readonly parts: readonly string[];
  };
}
/** PPTX output is canonical; unsupported features are reported explicitly. */
export interface PptxExport {
  readonly bytes: Uint8Array;
  readonly diagnostics: readonly DeckDiagnostic[];
}
/** Container layout changes retain their existing children and identities. */
export type ContainerLayout =
  | { readonly type: "stack" | "row"; readonly gap: number }
  | { readonly type: "grid"; readonly columns: number; readonly gap: number }
  | { readonly type: "canvas" };
/** Atomic serializable authoring operations form the agent tool contract. */
export type DeckOperation =
  | {
      readonly type: "updateText";
      readonly nodeId: string;
      readonly text: TextContent;
    }
  | {
      readonly type: "updateStyle";
      readonly nodeId: string;
      readonly style: TextStyle;
    }
  | {
      readonly type: "setFrame";
      readonly nodeId: string;
      readonly frame: ElementFrame | null;
    }
  | {
      readonly type: "setLayout";
      readonly nodeId: string;
      readonly layout: ContainerLayout;
    }
  | {
      readonly type: "replaceNode";
      readonly nodeId: string;
      readonly node: SlideNode;
    }
  | {
      readonly type: "insertNode";
      readonly parentId: string;
      readonly index: number;
      readonly node: SlideNode;
    }
  | { readonly type: "deleteNode"; readonly nodeId: string }
  | {
      readonly type: "moveNode";
      readonly nodeId: string;
      readonly parentId: string;
      readonly index: number;
    }
  | {
      readonly type: "insertSlide";
      readonly index: number;
      readonly slide: DeckSlide;
    }
  | { readonly type: "deleteSlide"; readonly slideId: string }
  | {
      readonly type: "moveSlide";
      readonly slideId: string;
      readonly index: number;
    }
  | {
      readonly type: "updateSlide";
      readonly slideId: string;
      readonly title?: string;
      readonly notes?: string;
      readonly background?: string;
      readonly hidden?: boolean;
    }
  | { readonly type: "setTheme"; readonly theme: DeckTheme }
  | { readonly type: "upsertAsset"; readonly asset: DeckAsset }
  | { readonly type: "deleteAsset"; readonly assetId: string };
/** Portable engine capability: no DOM, file access, network or React dependencies. */
export interface LipatEngine {
  /** Validate and copy untrusted serialized document data. */
  parseDocument(input: unknown): LipatResult<DeckDocument>;
  /** Compile layout with the same implementation as native Rust. */
  compile(
    document: DeckDocument,
    options?: CompileOptions,
  ): LipatResult<CompileOutput>;
  /** Validate the complete candidate before returning an edited document. */
  applyDocument(
    document: DeckDocument,
    operations: readonly DeckOperation[],
  ): LipatResult<DeckDocument>;
  /** Parse independently of authoring and layout. */
  parsePptx(bytes: Uint8Array): LipatResult<ImportedPresentation>;
  /** Export resolved scenes without recompiling authoring data. */
  writePptx(scene: SlideScene): LipatResult<PptxExport>;
  /** Explicitly lift imported scene geometry into editable canvas nodes. */
  importScene(scene: SlideScene): LipatResult<DeckDocument>;
}
/** Deep freeze protects runtime snapshots from mutation by host code. */
export function freezeDocument<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const item of Object.values(value)) freezeDocument(item);
  }
  return value;
}
/** Decode base64 without Node or browser ambient APIs. Input must already be validated. */
export function decodeAssetBytes(text: string): Uint8Array {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const padding = text.endsWith("==") ? 2 : text.endsWith("=") ? 1 : 0;
  const output = new Uint8Array(Math.floor((text.length * 3) / 4) - padding);
  let buffer = 0,
    bits = 0,
    index = 0;
  for (const char of text) {
    if (char === "=") break;
    const value = alphabet.indexOf(char);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output[index++] = (buffer >> bits) & 255;
    }
  }

  return output;
}
/** Encode byte input without btoa, Buffer or filesystem dependencies. */
export function encodeAssetBytes(bytes: Uint8Array): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const chunks: string[] = [];
  let chunk = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0,
      b = bytes[i + 1] ?? 0,
      c = bytes[i + 2] ?? 0;
    chunk +=
      (alphabet[(a >> 2) & 63] ?? "") +
      (alphabet[((a & 3) << 4) | (b >> 4)] ?? "") +
      (i + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : "=") +
      (i + 2 < bytes.length ? alphabet[c & 63] : "=");
    if (chunk.length >= 16384) {
      chunks.push(chunk);
      chunk = "";
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks.join("");
}
/** Extract plain text from semantic nodes for compact inspection and search. */
export function getNodeText(node: SlideNode): string {
  if ("text" in node)
    return typeof node.text === "string"
      ? node.text
      : node.text.map((r) => r.text).join("");
  if (node.type === "list") return node.items.join("\n");
  if (node.type === "table")
    return [node.columns, ...node.rows].map((r) => r.join("\t")).join("\n");
  if ("children" in node)
    return node.children.map(getNodeText).filter(Boolean).join("\n");
  return "";
}
