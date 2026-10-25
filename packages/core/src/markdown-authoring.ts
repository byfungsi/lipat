import type {
  DeckInput,
  DeckAsset,
  DeckTheme,
  LipatResult,
  SlideNode,
  DeckSlide,
  DeckDocument,
  DeckDiagnostic,
  LipatEngine,
  CompileOptions,
  SlideScene,
} from "@lipat-internal/model";
import { freezeDocument } from "@lipat-internal/model";
/** Creation metadata shared by lightweight Markdown parsing and measured import. */
export interface MarkdownAuthoringOptions {
  readonly id: string;
  readonly title?: string;
  readonly assets?: readonly DeckAsset[];
  readonly theme?: DeckTheme;
}
/** A slide's source lines are 1-based, start-inclusive/end-exclusive; separator lines are excluded. */
export interface MarkdownSlideBoundary {
  readonly slideId: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly separatorBefore:
    | { readonly kind: "start" }
    | { readonly kind: "horizontal" | "vertical"; readonly line: number };
}
/** Boundaries come from the actual parser, including empty slides and fenced-code handling. */
export interface MarkdownImportSummary {
  readonly slideCount: number;
  readonly boundaries: readonly MarkdownSlideBoundary[];
}
/** Measured import requires an explicit engine; it never fetches images or changes slide-separator grammar. */
export interface MarkdownImportOptions extends MarkdownAuthoringOptions {
  readonly engine: LipatEngine;
  readonly compileOptions?: CompileOptions;
}
/** Canonical working document, resolved scene, import boundaries and pre-export diagnostics. */
export interface MarkdownImportOutput {
  readonly document: DeckDocument;
  readonly scene: SlideScene;
  readonly summary: MarkdownImportSummary;
  readonly diagnostics: readonly DeckDiagnostic[];
}
/** Parse deterministic slide Markdown, including asset references and HTTP(S) image URLs without fetching. */
export function fromMarkdown(
  source: string,
  options: MarkdownAuthoringOptions,
): LipatResult<DeckInput> {
  const parsed = parseMarkdownSource(source, options);
  return parsed.ok ? { ok: true, value: parsed.value.document } : parsed;
}
/** Import Markdown with source-boundary feedback and diagnostics from the engine's actual layout measurements. */
export function importMarkdown(
  source: string,
  options: MarkdownImportOptions,
): LipatResult<MarkdownImportOutput> {
  const parsed = parseMarkdownSource(source, options);
  if (!parsed.ok) return parsed;
  const document = options.engine.parseDocument(parsed.value.document);
  if (!document.ok) return document;
  const compiled = options.engine.compile(
    document.value,
    options.compileOptions,
  );
  if (!compiled.ok) return compiled;
  const diagnostics = [...compiled.value.diagnostics];
  const overflow = diagnostics.find(
    (item) =>
      item.code === "layoutOverflow" ||
      item.code === "textOverflow" ||
      item.code === "outsideSlide",
  );
  const slide = document.value.slides[0];
  if (parsed.value.summary.slideCount === 1 && overflow && slide) {
    diagnostics.push({
      code: "markdownSingleSlideOverflow",
      severity: "warning",
      slideId: slide.id,
      nodeId: overflow.nodeId ?? slide.content.id,
      message:
        "Markdown produced one overflowing slide. Headings do not start slides; add standalone --- lines to split content across slides, or shorten/reformat the content.",
      recommendations: ["addSlideBreaks", "splitContent"],
      ...(overflow.bounds ? { bounds: overflow.bounds } : {}),
    });
  }
  return {
    ok: true,
    value: freezeDocument({
      document: document.value,
      scene: compiled.value.scene,
      summary: parsed.value.summary,
      diagnostics,
    }),
  };
}
function parseMarkdownSource(
  source: string,
  options: MarkdownAuthoringOptions,
): LipatResult<{
  readonly document: DeckInput;
  readonly summary: MarkdownImportSummary;
}> {
  if (source.length > 2_000_000)
    return {
      ok: false,
      error: {
        reason: "resourceLimit",
        message: "Markdown source exceeds two million characters",
      },
    };
  const slides: DeckSlide[] = [];
  const boundaries: MarkdownSlideBoundary[] = [];
  let startLine = 1;
  let separatorBefore: MarkdownSlideBoundary["separatorBefore"] = {
    kind: "start",
  };
  let lines: string[] = [],
    fence = false,
    parentId: string | undefined,
    vertical = false;
  const flush = (endLine: number): LipatResult<void> => {
    const index = slides.length + 1,
      slideId = `${options.id}-slide-${index}`;
    const children: SlideNode[] = [];
    let notes = "",
      title = "";
    let counter = 0;
    const id = () => `${slideId}-node-${++counter}`;
    let i = 0;
    while (i < lines.length) {
      const line = lines[i] ?? "";
      if (/^notes?:\s*/i.test(line)) {
        notes = [line.replace(/^notes?:\s*/i, ""), ...lines.slice(i + 1)]
          .join("\n")
          .trim();
        break;
      }
      if (!line.trim()) {
        i++;
        continue;
      }
      const heading = /^(#{1,6})\s+(.+)$/.exec(line);
      if (heading) {
        const text = heading[2] ?? "";
        title ||= text;
        children.push({
          id: id(),
          type: "heading",
          level: heading[1]?.length ?? 1,
          text,
        });
        i++;
        continue;
      }
      if (line.startsWith("```")) {
        const language = line.slice(3).trim();
        const code: string[] = [];
        i++;
        while (i < lines.length && !(lines[i] ?? "").startsWith("```"))
          code.push(lines[i++] ?? "");
        if (i === lines.length)
          return {
            ok: false,
            error: {
              reason: "invalidMarkdown",
              message: "Unclosed fenced code block",
            },
          };
        children.push({
          id: id(),
          type: "code",
          language,
          text: code.join("\n"),
        });
        i++;
        continue;
      }
      const image = /^!\[([^\]]*)\]\((.+)\)\s*$/.exec(line);
      if (image) {
        const source = image[2] ?? "";
        if (!source.startsWith("asset:") && !/^https?:\/\//i.test(source))
          return {
            ok: false,
            error: {
              reason: "invalidMarkdown",
              message:
                "Markdown image requires an asset: reference or absolute HTTP(S) URL",
            },
          };
        children.push({
          id: id(),
          type: "image",
          ...(source.startsWith("asset:")
            ? { assetId: source.slice(6) }
            : { url: source }),
          alt: image[1] ?? "",
          fit: "contain",
        });
        i++;
        continue;
      }
      if (/^\s*(?:[-*+] |\d+\. )/.test(line)) {
        const ordered = /^\s*\d+\./.test(line);
        const items: string[] = [];
        while (i < lines.length && /^\s*(?:[-*+] |\d+\. )/.test(lines[i] ?? ""))
          items.push((lines[i++] ?? "").replace(/^\s*(?:[-*+] |\d+\. )/, ""));
        children.push({ id: id(), type: "list", items, ordered });
        continue;
      }
      if (line.includes("|") && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] ?? "")) {
        const cells = (l: string) =>
          l
            .trim()
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((s) => s.trim());
        const columns = cells(line);
        i += 2;
        const rows: string[][] = [];
        while (i < lines.length && (lines[i] ?? "").includes("|"))
          rows.push(cells(lines[i++] ?? ""));
        children.push({ id: id(), type: "table", columns, rows });
        continue;
      }
      const paragraph = [line];
      i++;
      while (
        i < lines.length &&
        (lines[i] ?? "").trim() &&
        !/^(#{1,6}\s|```|notes?:|[-*+] |\d+\. |!\[)/i.test(lines[i] ?? "")
      )
        paragraph.push(lines[i++] ?? "");
      children.push({ id: id(), type: "text", text: paragraph.join("\n") });
    }
    const slide: DeckSlide = {
      id: slideId,
      title,
      notes,
      content: { id: `${slideId}-body`, type: "stack", children },
      ...(vertical && parentId ? { parentId } : {}),
    };
    slides.push(slide);
    boundaries.push({ slideId, startLine, endLine, separatorBefore });
    if (!vertical) parentId = slideId;
    lines = [];
    return { ok: true, value: undefined };
  };
  const sourceLines = source.replace(/\r\n?/g, "\n").split("\n");
  for (const [lineIndex, line] of sourceLines.entries()) {
    const lineNumber = lineIndex + 1;
    if (line.startsWith("```")) fence = !fence;
    if (!fence && /^---\s*$/.test(line)) {
      const r = flush(lineNumber);
      if (!r.ok) return r;
      vertical = false;
      startLine = lineNumber + 1;
      separatorBefore = { kind: "horizontal", line: lineNumber };
    } else if (!fence && /^--\s*$/.test(line)) {
      const r = flush(lineNumber);
      if (!r.ok) return r;
      vertical = true;
      startLine = lineNumber + 1;
      separatorBefore = { kind: "vertical", line: lineNumber };
    } else lines.push(line);
  }
  const last = flush(sourceLines.length + 1);
  if (!last.ok) return last;
  return {
    ok: true,
    value: {
      document: {
        id: options.id,
        title: options.title ?? "",
        slides,
        ...(options.assets ? { assets: options.assets } : {}),
        ...(options.theme ? { theme: options.theme } : {}),
      },
      summary: { slideCount: slides.length, boundaries },
    },
  };
}
