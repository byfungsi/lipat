import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createLipat, createDeck } from "../packages/lipat/dist/index.js";
import {
  createPresentationTemplate,
  presentationTemplates,
} from "../packages/lipat/dist/templates.js";
import {
  renderSlideSvg,
  renderDeckHtml,
  escapeSlideMarkup,
} from "../packages/lipat/dist/render.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const unwrap = (result) => {
  if (!result.ok) throw Error(result.error.message);
  return result.value;
};
const engine = unwrap(
  createLipat(
    new Uint8Array(readFileSync(resolve(root, "packages/wasm/lipat.wasm"))),
  ),
);
const out = resolve(root, "examples/react-demo/public/templates"),
  review = resolve(root, "artifacts/template-review");
mkdirSync(out, { recursive: true });
mkdirSync(review, { recursive: true });
const reports = [];
for (const info of presentationTemplates) {
  const folder = resolve(out, info.id);
  mkdirSync(folder, { recursive: true });
  const deck = unwrap(
    createDeck(unwrap(createPresentationTemplate(info.id)), { engine }),
  );
  const compiled = unwrap(deck.compile());
  const overflow = compiled.diagnostics.filter((d) => d.bounds);
  if (overflow.length) throw Error(`${info.id}: ${JSON.stringify(overflow)}`);
  const pptx = unwrap(engine.writePptx(compiled.scene));
  if (unwrap(engine.parsePptx(pptx.bytes)).scene.slides.length !== 6)
    throw Error(`Template export lost slides: ${info.id}`);
  for (const [i, slide] of compiled.scene.slides.entries()) {
    const svg = renderSlideSvg(compiled.scene, slide.id, {
      imagePolicy: "embedded-only",
    });
    writeFileSync(resolve(folder, `slide-${i + 1}.svg`), svg);
    if (i === 0) writeFileSync(resolve(folder, "cover.svg"), svg);
  }
  writeFileSync(
    resolve(folder, "deck.lipat.json"),
    JSON.stringify(deck.exportDocument(), null, 2),
  );
  writeFileSync(resolve(folder, "scene.json"), JSON.stringify(compiled.scene));
  writeFileSync(resolve(folder, "deck.pptx"), pptx.bytes);
  writeFileSync(
    resolve(folder, "deck.html"),
    renderDeckHtml(compiled.scene, { imagePolicy: "embedded-only" }),
  );
  reports.push({
    id: info.id,
    slides: 6,
    diagnostics: compiled.diagnostics,
    chartCount: compiled.scene.slides
      .flatMap((s) => s.elements)
      .filter((e) => e.type === "chart").length,
  });
}
writeFileSync(
  resolve(out, "catalog.json"),
  JSON.stringify(presentationTemplates, null, 2),
);
writeFileSync(resolve(review, "report.json"), JSON.stringify(reports, null, 2));
for (let page = 0; page < 6; page++) {
  const cards = presentationTemplates
    .slice(page * 5, page * 5 + 5)
    .map(
      (t) =>
        `<section><h2>${escapeSlideMarkup(t.name)} <small>${escapeSlideMarkup(t.domain)}</small></h2><div class="slides">${t.slideTitles.map((title, i) => `<a href="../../examples/react-demo/public/templates/${t.id}/slide-${i + 1}.svg"><img src="../../examples/react-demo/public/templates/${t.id}/slide-${i + 1}.svg" alt="${escapeSlideMarkup(title)}"/><span>${i + 1}. ${escapeSlideMarkup(title)}</span></a>`).join("")}</div></section>`,
    )
    .join("");
  writeFileSync(
    resolve(review, `contact-${page + 1}.html`),
    `<!doctype html><meta charset="utf-8"><title>Lipat template review ${page + 1}</title><style>body{font:12px Arial;background:#e7e8ec;color:#18202e;margin:10px auto;max-width:1260px}h1{font-size:18px;margin:0 0 12px}h2{font-size:13px;margin:8px 0}small{font-weight:400;color:#586273;margin-left:12px}.slides{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}a{display:block;color:inherit;text-decoration:none}img{display:block;width:100%;aspect-ratio:16/9;box-shadow:0 2px 5px #17203318}span{display:block;font-size:10px;height:20px;line-height:13px;margin-top:4px}section{margin-bottom:5px}</style><h1>Original Lipat templates / ${page + 1} of 6 · 30 slides per sheet</h1>${cards}`,
  );
}
console.log(
  `Generated ${presentationTemplates.length} complete template decks, 180 SVG slides, PPTX/HTML/JSON downloads and six review contact sheets.`,
);
