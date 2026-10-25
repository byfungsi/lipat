import type { SlideScene } from "@lipat-internal/model";
import type { ImageRenderPolicy } from "@lipat-internal/render";
import { escapeSlideMarkup, renderSlideSvg } from "@lipat-internal/render";
/** Inject reveal.js rather than importing a browser player into headless entrypoints. */
export interface RevealInstance {
  initialize(options?: object): Promise<unknown>;
  sync(): void;
  destroy(): void;
}
/** Render horizontal slides and optional vertical stacks into reveal.js-compatible sections. */
export function renderRevealMarkup(
  scene: SlideScene,
  options: { readonly imagePolicy?: ImageRenderPolicy } = {},
): string {
  const slides = scene.slides.filter((s) => !s.hidden);
  const render = (id: string) => {
    const slide = slides.find((s) => s.id === id);
    if (!slide) return "";
    const svg = renderSlideSvg(scene, id, options).replace(
      /data-step="(\d+)"/g,
      (_, step: string) =>
        Number(step) > 0
          ? `class="fragment" data-fragment-index="${Number(step) - 1}"`
          : "",
    );
    return `<section data-lipat-slide="${escapeSlideMarkup(id)}">${svg}<aside class="notes">${escapeSlideMarkup(slide.notes)}</aside></section>`;
  };
  return `<div class="slides">${slides
    .filter(
      (s) => !s.parentId || !slides.some((parent) => parent.id === s.parentId),
    )
    .map((s) => {
      const children = slides.filter((c) => c.parentId === s.id);
      return children.length
        ? `<section>${render(s.id)}${children.map((c) => render(c.id)).join("")}</section>`
        : render(s.id);
    })
    .join("")}</div>`;
}
/** Update an existing reveal.js root and synchronize its presentation state. */
export function updateRevealPresentation(
  root: { innerHTML: string },
  reveal: RevealInstance,
  scene: SlideScene,
  options: { readonly imagePolicy?: ImageRenderPolicy } = {},
): void {
  root.innerHTML = renderRevealMarkup(scene, options);
  reveal.sync();
}
