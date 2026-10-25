import type {
  DeckInput,
  DeckAsset,
  DeckTheme,
  LipatResult,
  SlideNode,
  DeckSlide,
} from "@lipat-internal/model";
/** Parse a small deterministic Markdown authoring format: --- slides, -- vertical slides, Notes:, lists, code, tables and asset images. */
export function fromMarkdown(
  source: string,
  options: {
    readonly id: string;
    readonly title?: string;
    readonly assets?: readonly DeckAsset[];
    readonly theme?: DeckTheme;
  },
): LipatResult<DeckInput> {
  if (source.length > 2_000_000)
    return {
      ok: false,
      error: {
        reason: "resourceLimit",
        message: "Markdown source exceeds two million characters",
      },
    };
  const slides: DeckSlide[] = [];
  let lines: string[] = [],
    fence = false,
    parentId: string | undefined,
    vertical = false;
  const flush = (): LipatResult<void> => {
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
      const image = /^!\[([^\]]*)\]\(asset:([^)]+)\)\s*$/.exec(line);
      if (image) {
        children.push({
          id: id(),
          type: "image",
          assetId: image[2] ?? "",
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
        !/^(#{1,6}\s|```|notes?:|[-*+] |\d+\. )/i.test(lines[i] ?? "")
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
    if (!vertical) parentId = slideId;
    lines = [];
    return { ok: true, value: undefined };
  };
  for (const line of source.replace(/\r\n?/g, "\n").split("\n")) {
    if (line.startsWith("```")) fence = !fence;
    if (!fence && /^---\s*$/.test(line)) {
      const r = flush();
      if (!r.ok) return r;
      vertical = false;
    } else if (!fence && /^--\s*$/.test(line)) {
      const r = flush();
      if (!r.ok) return r;
      vertical = true;
    } else lines.push(line);
  }
  const last = flush();
  if (!last.ok) return last;
  return {
    ok: true,
    value: {
      id: options.id,
      title: options.title ?? "",
      slides,
      ...(options.assets ? { assets: options.assets } : {}),
      ...(options.theme ? { theme: options.theme } : {}),
    },
  };
}
