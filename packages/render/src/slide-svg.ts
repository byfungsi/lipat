import type {
  SceneElement,
  SceneSlide,
  SlideScene,
  TextStyle,
} from "@lipat-internal/model";
/** Embedded-only rendering never emits remote image references; it accepts raster assets, not embedded SVG. */
export type ImageRenderPolicy = "allow-external" | "embedded-only";
/** Rendering controls apply to static markup and playback surfaces without changing scene data. */
export interface SlideRenderOptions {
  readonly title?: string;
  readonly step?: number;
  readonly retainSteps?: boolean;
  readonly imagePolicy?: ImageRenderPolicy;
}
function numberValue(value: number, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function paintValue(
  value: string | null | undefined,
  fallback: string,
): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : fallback;
}
/** Escape text and attribute content before creating SVG or HTML. */
export function escapeSlideMarkup(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] ?? c,
  );
}
function attributes(style: TextStyle): string {
  return `font-family="${escapeSlideMarkup(style.fontFamily ?? "Arial")}" font-size="${numberValue(style.fontSize ?? 24, 24)}" fill="${paintValue(style.color, "#172033")}" font-weight="${style.bold ? "700" : "400"}" font-style="${style.italic ? "italic" : "normal"}" text-decoration="${style.underline ? "underline" : "none"}"`;
}
function textSvg(element: Extract<SceneElement, { type: "text" }>): string {
  const f = renderFrame(element.frame),
    style = element.style;
  const size = numberValue(style.fontSize ?? 24, 24);
  let cursor = 0;
  const offsets = element.runs.map((run) => {
    const start = cursor;
    cursor += run.text.length;
    return { run, start, end: cursor };
  });
  cursor = 0;
  return element.lines
    .map((line, i) => {
      let start = element.text.indexOf(line, cursor);
      if (start < 0) start = cursor;
      const end = start + line.length;
      cursor = end;
      const spans = offsets
        .filter((r) => r.end > start && r.start < end)
        .map(
          (r) =>
            `<tspan ${attributes({ ...style, ...r.run.style })}>${escapeSlideMarkup(r.run.text.slice(Math.max(0, start - r.start), Math.min(r.run.text.length, end - r.start)))}</tspan>`,
        )
        .join("");
      const x =
        style.align === "center"
          ? f.x + f.width / 2
          : style.align === "right"
            ? f.x + f.width
            : f.x;
      return `<text x="${x}" y="${f.y + size + i * element.lineHeight}" text-anchor="${style.align === "center" ? "middle" : style.align === "right" ? "end" : "start"}" ${attributes(style)} xml:space="preserve">${spans || escapeSlideMarkup(line)}</text>`;
    })
    .join("");
}
function renderFrame(frame: SceneElement["frame"]): SceneElement["frame"] {
  return {
    x: numberValue(frame.x),
    y: numberValue(frame.y),
    width: numberValue(frame.width),
    height: numberValue(frame.height),
    rotation: numberValue(frame.rotation ?? 0),
  };
}
function elementSvg(
  element: SceneElement,
  scene: SlideScene,
  hidden: boolean,
  imagePolicy: ImageRenderPolicy,
): string {
  const f = renderFrame(element.frame);
  let body = "";
  switch (element.type) {
    case "text":
      body = textSvg(element);
      break;
    case "shape": {
      const paint = `fill="${paintValue(element.fill, "none")}" stroke="${paintValue(element.stroke, "none")}"`;
      body =
        element.geometry === "ellipse"
          ? `<ellipse cx="${f.x + f.width / 2}" cy="${f.y + f.height / 2}" rx="${f.width / 2}" ry="${f.height / 2}" ${paint}/>`
          : element.geometry === "line"
            ? `<line x1="${f.x}" y1="${f.y}" x2="${f.x + f.width}" y2="${f.y + f.height}" ${paint}/>`
            : `<rect x="${f.x}" y="${f.y}" width="${f.width}" height="${f.height}" rx="${element.geometry === "roundRect" ? Math.min(f.width, f.height) * 0.1 : 0}" ${paint}/>`;
      break;
    }
    case "image": {
      const asset = scene.assets.find((a) => a.id === element.assetId);
      const embedded =
        asset &&
        ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(
          asset.mimeType,
        ) &&
        asset.data.length % 4 === 0 &&
        /^[A-Za-z0-9+/]*={0,2}$/.test(asset.data)
          ? `data:${asset.mimeType};base64,${asset.data}`
          : undefined;
      const source =
        element.url !== undefined
          ? imagePolicy === "allow-external" &&
            /^https?:\/\//i.test(element.url)
            ? element.url
            : undefined
          : embedded;
      if (source)
        body = `<image x="${f.x}" y="${f.y}" width="${f.width}" height="${f.height}" href="${escapeSlideMarkup(source)}" preserveAspectRatio="${element.fit === "stretch" ? "none" : element.fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}"><title>${escapeSlideMarkup(element.alt)}</title></image>`;
      break;
    }
    case "table": {
      const rows = [element.columns, ...element.rows],
        h = f.height / rows.length,
        w = f.width / element.columns.length;
      body = rows
        .map((r, ri) =>
          r
            .map(
              (cell, ci) =>
                `<rect x="${f.x + ci * w}" y="${f.y + ri * h}" width="${w}" height="${h}" fill="${paintValue(element.style.color, "#172033")}" fill-opacity="${ri === 0 ? 0.06 : 0}" stroke="${paintValue(element.style.color, "#172033")}" stroke-opacity="0.2"/><text x="${f.x + ci * w + 8}" y="${f.y + ri * h + numberValue(element.style.fontSize ?? 18, 18) + 8}" ${attributes({ ...element.style, bold: ri === 0 })}>${escapeSlideMarkup(cell)}</text>`,
            )
            .join(""),
        )
        .join("");
      break;
    }
  }
  return `<g data-node-id="${escapeSlideMarkup(element.id)}"${element.step !== undefined ? ` data-step="${numberValue(element.step)}"` : ""} transform="rotate(${f.rotation ?? 0} ${f.x + f.width / 2} ${f.y + f.height / 2})"><g data-playback-id="${escapeSlideMarkup(element.id)}"${hidden ? ' style="visibility:hidden" aria-hidden="true"' : ""}>${body}</g></g>`;
}
/** Render a validated compiled/imported slide without a browser or React. */
export function renderSlideSvg(
  scene: SlideScene,
  slideId: string,
  options: SlideRenderOptions = {},
): string {
  const slide = scene.slides.find((s) => s.id === slideId);
  if (!slide) return "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${numberValue(scene.size.width)} ${numberValue(scene.size.height)}" role="img" aria-label="${escapeSlideMarkup(options.title ?? slide.title)}" style="display:block;width:100%;height:auto"><title>${escapeSlideMarkup(options.title ?? slide.title)}</title><rect width="100%" height="100%" fill="${paintValue(slide.background, "#FFFFFF")}"/>${slide.elements
    .filter(
      (e) =>
        options.retainSteps ||
        options.step === undefined ||
        e.step === undefined ||
        e.step <= options.step,
    )
    .map((e) =>
      elementSvg(
        e,
        scene,
        options.step !== undefined && (e.step ?? 0) > options.step,
        options.imagePolicy ?? "allow-external",
      ),
    )
    .join("")}</svg>`;
}
/** Export self-contained HTML with keyboard navigation, fragment steps, notes and print styling. */
export function renderDeckHtml(
  scene: SlideScene,
  options: { readonly imagePolicy?: ImageRenderPolicy } = {},
): string {
  const slides = scene.slides.filter((s) => !s.hidden);
  const sections = slides
    .map(
      (s, i) =>
        `<section data-slide="${i}" aria-label="${escapeSlideMarkup(s.title)}"${i > 0 ? " hidden" : ""}>${renderSlideSvg(scene, s.id, options)}<aside hidden>${escapeSlideMarkup(s.notes)}</aside></section>`,
    )
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeSlideMarkup(scene.title)}</title><style>body{margin:0;background:#111827;color:white;font-family:Arial,sans-serif}main{max-width:1280px;margin:auto;height:90vh;display:grid;place-items:center}section{width:100%}[hidden]{display:none!important}nav{display:flex;justify-content:center;gap:16px;align-items:center}button{padding:8px 16px;cursor:pointer}@media print{body{background:white}main{display:block;height:auto}section[hidden],section{display:block!important;break-after:page}nav{display:none}[data-step]{visibility:visible!important}}</style></head><body><main>${sections}</main><nav><button id="previous" aria-label="Previous slide">←</button><output id="position"></output><button id="next" aria-label="Next slide">→</button><button id="notes">Notes</button></nav><script>(()=>{const slides=[...document.querySelectorAll('section[data-slide]')];let index=0,step=0;const max=()=>Math.max(0,...[...slides[index]?.querySelectorAll('[data-step]')??[]].map(e=>Number(e.dataset.step)));function show(){slides.forEach((s,i)=>{s.hidden=i!==index;s.querySelectorAll('[data-step]').forEach(e=>{e.style.visibility=Number(e.dataset.step)<=step?'visible':'hidden'})});document.getElementById('position').textContent=slides.length?(index+1)+' / '+slides.length:'No visible slides'}function next(){if(step<max())step++;else if(index<slides.length-1){index++;step=0}show()}function previous(){if(step>0)step--;else if(index>0){index--;step=max()}show()}document.getElementById('next').onclick=next;document.getElementById('previous').onclick=previous;document.getElementById('notes').onclick=()=>{const aside=slides[index]?.querySelector('aside');if(aside)aside.hidden=!aside.hidden};document.addEventListener('keydown',e=>{if(['ArrowRight','ArrowDown',' '].includes(e.key)){e.preventDefault();next()}if(['ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();previous()}});show()})();</script></body></html>`;
}
