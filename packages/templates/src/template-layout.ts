import type { DeckSlide, SlideNode } from "@lipat-internal/model";
import type { TemplateRecipe, TemplateSlideRecipe } from "./template-types";

function blend(a: string, b: string, t: number): string {
  return (
    "#" +
    [1, 3, 5]
      .map((i) =>
        Math.round(
          parseInt(a.slice(i, i + 2), 16) * (1 - t) +
            parseInt(b.slice(i, i + 2), 16) * t,
        )
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
function contrastInk(color: string): string {
  const [r = 0, g = 0, b = 0] = [1, 3, 5]
    .map((i) => parseInt(color.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? "#172033" : "#FFFFFF";
}

/** Expand a content-specific template composition to ordinary editable canvas nodes in points. */
export function createTemplateSlide(
  recipe: TemplateRecipe,
  slide: TemplateSlideRecipe,
  index: number,
  organization: string,
): DeckSlide {
  const [bg, fg, accent, secondary] = recipe.palette,
    panel = blend(bg, fg, 0.055),
    muted = blend(bg, fg, 0.72),
    line = blend(bg, fg, 0.2);
  const id = `${recipe.id}-slide-${index + 1}`,
    nodes: SlideNode[] = [];
  let sequence = 0;
  const frame = (x: number, y: number, width: number, height: number) => ({
    x,
    y,
    width,
    height,
  });
  const uid = (name: string) => `${id}-${name}-${++sequence}`;
  const text = (
    name: string,
    value: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size = 26,
    color = fg,
    bold = false,
    font = "Arial",
  ) =>
    nodes.push({
      id: uid(name),
      type: name === "title" ? "heading" : "text",
      text: value,
      frame: frame(x, y, w, h),
      style: { fontSize: size, color, bold, fontFamily: font },
    });
  const shape = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string | null,
    stroke: string | null = null,
    geometry: "rect" | "roundRect" | "ellipse" | "line" = "rect",
  ) =>
    nodes.push({
      id: uid("shape"),
      type: "shape",
      frame: frame(x, y, w, h),
      fill,
      stroke,
      geometry,
    });
  const artwork = (x: number, y: number, w: number, h: number) =>
    nodes.push({
      id: uid("artwork"),
      type: "image",
      assetId: "template-artwork",
      alt: `Original ${recipe.motif} illustration`,
      fit: "contain",
      frame: frame(x, y, w, h),
    });
  const kicker = (value: string, x = 64, y = 48) =>
    text("kicker", value.toUpperCase(), x, y, 1050, 28, 18, muted, true);
  const title = (
    value: string,
    x = 64,
    y = 100,
    w = 1152,
    h = 112,
    size = 44,
  ) =>
    text(
      "title",
      value,
      x,
      y,
      w,
      h,
      size,
      fg,
      recipe.font === "Arial",
      recipe.font,
    );
  const itemList = "items" in slide ? (slide.items ?? []) : [];
  const count = itemList.length;

  if (slide.layout === "cover") {
    switch (recipe.cover) {
      case "orbit":
        artwork(720, 90, 520, 520);
        kicker(slide.label);
        title(slide.title, 64, 180, 690, 310, 76);
        text("subtitle", slide.body, 66, 520, 640, 100, 26);
        shape(64, 635, 150, 6, accent);
        break;
      case "editorial":
        shape(64, 85, 1152, 1, null, line, "line");
        kicker(slide.label, 64, 42);
        title(slide.title, 64, 145, 1060, 230, 76);
        text("subtitle", slide.body, 68, 405, 660, 150, 28);
        artwork(890, 400, 275, 250);
        break;
      case "frame":
        shape(36, 36, 1208, 610, null, line);
        kicker(slide.label, 80, 68);
        artwork(870, 170, 320, 320);
        title(slide.title, 80, 192, 740, 250, 68);
        text("subtitle", slide.body, 82, 482, 735, 110, 28);
        break;
      case "stripe":
        shape(0, 520, 1280, 144, accent);
        kicker(slide.label);
        title(slide.title, 64, 158, 900, 270, 80);
        artwork(980, 200, 240, 240);
        text(
          "subtitle",
          slide.body,
          64,
          548,
          1120,
          90,
          26,
          contrastInk(accent),
        );
        break;
      case "monolith":
        shape(820, 0, 460, 664, panel);
        artwork(815, 90, 460, 460);
        kicker(slide.label);
        title(slide.title, 64, 160, 790, 330, 86);
        text("subtitle", slide.body, 68, 530, 700, 95, 26);
        break;
      case "arch":
        artwork(700, 90, 560, 560);
        shape(64, 132, 8, 380, accent);
        kicker(slide.label, 88, 72);
        title(slide.title, 90, 188, 620, 260, 68);
        text("subtitle", slide.body, 90, 478, 590, 140, 26);
        break;
      case "grid":
        shape(64, 122, 1152, 1, null, line, "line");
        shape(785, 122, 1, 490, null, line, "line");
        kicker(slide.label);
        title(slide.title, 64, 182, 660, 270, 70);
        artwork(830, 180, 350, 350);
        text("subtitle", slide.body, 64, 500, 660, 115, 26);
        break;
      case "signal":
        shape(64, 64, 74, 74, accent, null, "roundRect");
        text("mark", "01", 78, 78, 60, 54, 32, contrastInk(accent), true);
        kicker(slide.label, 170, 84);
        title(slide.title, 64, 205, 750, 285, 76);
        artwork(885, 270, 310, 310);
        text("subtitle", slide.body, 64, 535, 735, 90, 26);
        break;
      case "split":
        shape(700, 0, 580, 664, accent);
        artwork(730, 100, 500, 500);
        kicker(slide.label);
        title(slide.title, 64, 185, 595, 290, 66);
        text("subtitle", slide.body, 64, 515, 575, 120, 26);
        break;
      case "sunrise":
        artwork(870, 52, 320, 320);
        kicker(slide.label);
        title(slide.title, 64, 150, 860, 310, 78);
        shape(64, 490, 1152, 2, null, line, "line");
        text("subtitle", slide.body, 64, 532, 950, 90, 28);
        break;
    }
  } else if (slide.layout === "cta") {
    kicker("The next move");
    title(slide.title, 64, 148, 640, 230, 60);
    text("body", slide.body, 66, 418, 600, 165, 28);
    shape(740, 105, 1, 510, null, line, "line");
    itemList.forEach((item, i) => {
      const y = 150 + i * 145;
      text(
        "number",
        String(i + 1).padStart(2, "0"),
        790,
        y,
        60,
        48,
        28,
        muted,
        true,
      );
      text("action", item.label, 870, y, 330, 65, 28, fg, true);
      text("detail", item.detail, 870, y + 65, 330, 76, 22, muted);
    });
    if (!count) artwork(830, 180, 330, 330);
  } else {
    kicker(`${recipe.domain} / ${String(index + 1).padStart(2, "0")}`);
    title(slide.title);
    switch (slide.layout) {
      case "cards":
      case "metrics":
      case "compare": {
        text("intro", slide.body, 64, 205, 1140, 68, 24, muted);
        const w = (1152 - (count - 1) * 24) / count;
        itemList.forEach((item, i) => {
          const x = 64 + i * (w + 24);
          shape(
            x,
            300,
            w,
            320,
            slide.layout === "compare" && i === 1 ? accent : panel,
            null,
            "roundRect",
          );
          const ink =
            slide.layout === "compare" && i === 1 ? contrastInk(accent) : fg;
          if (slide.layout === "metrics") {
            text(
              "metric",
              item.metric ?? String(i + 1),
              x + 26,
              328,
              w - 52,
              100,
              68,
              ink,
              true,
            );
            text("label", item.label, x + 26, 444, w - 52, 70, 28, ink, true);
            text("detail", item.detail, x + 26, 526, w - 52, 78, 22, ink);
          } else {
            text(
              "index",
              slide.layout === "compare" && i === 1
                ? "RECOMMENDED"
                : String(i + 1).padStart(2, "0"),
              x + 26,
              326,
              w - 52,
              30,
              16,
              ink,
              true,
            );
            text(
              "label",
              item.label,
              x + 26,
              385,
              w - 52,
              88,
              32,
              ink,
              true,
              recipe.font,
            );
            text("detail", item.detail, x + 26, 495, w - 52, 104, 24, ink);
          }
        });
        break;
      }
      case "chart":
        shape(64, 225, 850, 408, panel, null, "roundRect");
        nodes.push({
          id: uid("chart"),
          type: "chart",
          chart: {
            ...slide.chart,
            categories: [...slide.chart.categories],
            series: slide.chart.series.map((series) => ({
              ...series,
              values: [...series.values],
            })),
            colors: [accent, secondary, blend(fg, bg, 0.25), "#9B7FB8"],
          },
          frame: frame(85, 245, 804, 355),
          style: { fontFamily: "Arial", color: fg },
        });
        shape(950, 245, 5, 335, accent);
        text("insight", slide.body, 980, 255, 230, 350, 26);
        text(
          "data-note",
          "Illustrative data · replace before use",
          86,
          608,
          780,
          24,
          16,
          muted,
        );
        break;
      case "timeline":
      case "process": {
        text("intro", slide.body, 64, 205, 1100, 72, 24, muted);
        const w = 1152 / count;
        shape(95, 337, 1090, 3, null, line, "line");
        itemList.forEach((item, i) => {
          const x = 64 + i * w;
          shape(
            x + 16,
            315,
            46,
            46,
            i % 2 ? secondary : accent,
            null,
            "ellipse",
          );
          text(
            "step",
            String(i + 1),
            x + 28,
            320,
            32,
            30,
            21,
            contrastInk(i % 2 ? secondary : accent),
            true,
          );
          text("phase", item.label, x + 16, 397, w - 44, 90, 30, fg, true);
          text("detail", item.detail, x + 16, 500, w - 44, 120, 23);
        });
        break;
      }
      case "matrix":
        text("intro", slide.body, 64, 205, 1120, 60, 24, muted);
        itemList.forEach((item, i) => {
          const x = 64 + (i % 2) * 588,
            y = 290 + Math.floor(i / 2) * 177;
          shape(x, y, 564, 154, panel, null, "roundRect");
          shape(x, y, 6, 154, i % 2 ? secondary : accent);
          text("label", item.label, x + 28, y + 22, 510, 48, 28, fg, true);
          text("detail", item.detail, x + 28, y + 77, 510, 65, 22);
        });
        break;
      case "agenda":
        text("intro", slide.body, 64, 205, 1120, 60, 24, muted);
        itemList.forEach((item, i) => {
          const y = 290 + i * 88;
          shape(64, y, 1152, 1, null, line, "line");
          text(
            "time",
            item.metric ?? String(i + 1).padStart(2, "0"),
            74,
            y + 20,
            160,
            50,
            28,
            fg,
            true,
          );
          text("label", item.label, 270, y + 20, 380, 55, 28, fg, true);
          text("detail", item.detail, 700, y + 22, 500, 58, 22, muted);
        });
        break;
      case "portfolio": {
        text("intro", slide.body, 64, 205, 1120, 58, 24, muted);
        const w = (1152 - (count - 1) * 24) / count;
        itemList.forEach((item, i) => {
          const x = 64 + i * (w + 24);
          shape(
            x,
            280,
            w,
            235,
            i % 2 ? blend(bg, secondary, 0.16) : panel,
            null,
            "roundRect",
          );
          artwork(x + 32, 292, w - 64, 205);
          text("label", item.label, x, 538, w, 48, 28, fg, true);
          text("detail", item.detail, x, 594, w, 52, 21, muted);
        });
        break;
      }
      case "statement":
        text(
          "statement",
          slide.body,
          68,
          255,
          1070,
          242,
          52,
          fg,
          recipe.font === "Arial",
          recipe.font,
        );
        shape(64, 555, 200, 6, accent);
        itemList.forEach((item, i) =>
          text(
            "support",
            `${item.label} — ${item.detail}`,
            64 + i * 390,
            597,
            360,
            60,
            20,
            muted,
          ),
        );
        break;
      case "split":
        artwork(770, 260, 380, 350);
        shape(700, 230, 1, 390, null, line, "line");
        text("body", slide.body, 64, 250, 585, 175, 32, fg, false, recipe.font);
        itemList.forEach((item, i) => {
          const y = 452 + i * 76;
          text("label", item.label, 64, y, 210, 60, 23, fg, true);
          text("detail", item.detail, 292, y, 350, 65, 22, muted);
        });
        break;
      case "quote":
        text(
          "quotation-mark",
          "“",
          64,
          195,
          180,
          180,
          140,
          accent,
          false,
          "Georgia",
        );
        text(
          "quote",
          slide.body,
          180,
          270,
          960,
          230,
          42,
          fg,
          false,
          recipe.font,
        );
        itemList.forEach((item, i) => {
          text(
            "attribution",
            item.label,
            185,
            540 + i * 50,
            950,
            45,
            22,
            fg,
            true,
          );
          text("context", item.detail, 185, 585 + i * 50, 950, 45, 20, muted);
        });
        break;
      case "code":
        shape(64, 235, 785, 395, panel, null, "roundRect");
        text(
          "code",
          slide.body,
          88,
          263,
          740,
          338,
          23,
          fg,
          false,
          "Courier New",
        );
        itemList.forEach((item, i) => {
          text("label", item.label, 900, 260 + i * 150, 300, 65, 28, fg, true);
          text("detail", item.detail, 900, 330 + i * 150, 300, 90, 23, muted);
        });
        break;
    }
  }
  shape(64, 664, 1152, 1, null, line, "line");
  text(
    "footer",
    `${organization}  /  ${recipe.name}`,
    64,
    681,
    980,
    25,
    15,
    muted,
  );
  text(
    "page",
    String(index + 1).padStart(2, "0"),
    1160,
    678,
    56,
    28,
    18,
    muted,
  );
  return {
    id,
    title: slide.title,
    background: bg,
    notes: `${recipe.name} · ${recipe.domain}. Original editable template. All sample organizations, quotations, dates, financial, clinical and outcome data are illustrative. Replace and verify before use. ${slide.layout === "chart" ? "Chart data stays editable in PowerPoint through its embedded workbook. " : ""}${slide.body}\n${itemList.map((item) => `${item.label}: ${item.detail}`).join("\n")}`,
    content: { id: `${id}-canvas`, type: "canvas", children: nodes },
  };
}
