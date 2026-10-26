import type { DeckSlide, SlideNode } from "@lipat-internal/model";
import type { TemplateRecipe, TemplateSlideRecipe } from "./template-types";
import type { TemplateArtDirection } from "./template-art-direction";

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

/** Build an editable editorial slide in points, with embedded photography and deliberate changes of visual pace. */
export function createTemplateSlide(
  recipe: TemplateRecipe,
  slide: TemplateSlideRecipe,
  index: number,
  organization: string,
  direction: TemplateArtDirection,
): DeckSlide {
  const [bg, fg, accent, secondary] = recipe.palette;
  const muted = blend(bg, fg, 0.72),
    rule = blend(bg, fg, 0.22),
    panel = blend(bg, fg, 0.055);
  const id = `${recipe.id}-slide-${index + 1}`;
  const nodes: SlideNode[] = [];
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
    width: number,
    height: number,
    size = 26,
    color = fg,
    bold = false,
    font = "Arial",
  ) =>
    nodes.push({
      id: uid(name),
      type: name === "title" ? "heading" : "text",
      text: value,
      frame: frame(x, y, width, height),
      style: { fontSize: size, color, bold, fontFamily: font },
    });
  const shape = (
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string | null,
    stroke: string | null = null,
  ) =>
    nodes.push({
      id: uid("shape"),
      type: "shape",
      frame: frame(x, y, width, height),
      fill,
      stroke,
      geometry: "rect",
    });
  const photoKey =
    slide.layout === "portfolio" ||
    slide.layout === "split" ||
    slide.layout === "process"
      ? (direction.detailPhoto ?? direction.photo)
      : direction.photo;
  const photo = (x: number, y: number, width: number, height: number) =>
    nodes.push({
      id: uid("photograph"),
      type: "image",
      assetId: `template-photo-${photoKey}`,
      alt: `Illustrative ${photoKey} editorial photograph`,
      fit: "cover",
      frame: frame(x, y, width, height),
    });
  const title = (
    value: string,
    x = 64,
    y = 93,
    width = 1152,
    height = 132,
    size = 48,
    color = fg,
  ) =>
    text(
      "title",
      value,
      x,
      y,
      width,
      height,
      size,
      color,
      recipe.font === "Arial",
      recipe.font,
    );
  const label = (value: string, x = 64, y = 43, width = 1050, color = muted) =>
    text("kicker", value.toUpperCase(), x, y, width, 28, 16, color, true);
  const items = "items" in slide ? (slide.items ?? []) : [];
  const count = items.length;
  let footerWidth = 1050,
    footerColor = muted;

  if (slide.layout === "cover") {
    switch (direction.cover) {
      case "editorial":
        photo(704, 0, 576, 720);
        label(recipe.domain, 64, 48, 580);
        shape(64, 107, 80, 4, accent);
        title(slide.title, 58, 160, 610, 345, 90);
        text("subtitle", slide.body, 64, 544, 556, 94, 26, muted);
        footerWidth = 580;
        break;
      case "panorama":
        photo(0, 0, 1280, 414);
        label(recipe.domain, 64, 447);
        title(slide.title.replace(/\n/g, " "), 60, 492, 1160, 108, 68);
        text("subtitle", slide.body, 64, 601, 1090, 64, 25, muted);
        break;
      case "gallery":
        photo(48, 48, 658, 604);
        label(recipe.domain, 758, 67, 466);
        title(slide.title, 751, 159, 465, 330, 72);
        shape(760, 518, 75, 3, accent);
        text("subtitle", slide.body, 760, 554, 448, 98, 25, muted);
        break;
      case "poster":
        photo(0, 0, 1280, 720);
        shape(0, 320, 740, 400, bg);
        label(recipe.domain, 52, 353, 636);
        title(slide.title, 46, 403, 650, 226, 82);
        text("subtitle", slide.body, 52, 626, 625, 65, 24, muted);
        footerWidth = 0;
        break;
      case "window":
        photo(604, 100, 612, 532);
        shape(0, 172, 655, 347, bg);
        label(recipe.domain, 64, 48);
        title(slide.title, 57, 199, 611, 310, 86);
        text("subtitle", slide.body, 64, 552, 495, 102, 25, muted);
        break;
      case "masthead":
        label(recipe.domain, 64, 43);
        title(slide.title.replace(/\n/g, " "), 56, 98, 1160, 135, 88);
        photo(64, 272, 780, 362);
        shape(892, 272, 3, 362, accent);
        text(
          "edition",
          "PERSPECTIVES\n01 / 06",
          932,
          286,
          260,
          70,
          18,
          muted,
          true,
        );
        text(
          "subtitle",
          slide.body,
          932,
          416,
          278,
          190,
          30,
          fg,
          false,
          recipe.font,
        );
        break;
    }
  } else if (slide.layout === "statement") {
    photo(0, 0, 500, 720);
    label(recipe.domain, 564, 48, 650);
    title(slide.title, 558, 132, 658, 222, 51);
    text("body", slide.body, 564, 383, 630, 172, 31, fg, false, recipe.font);
    items.forEach((item, i) =>
      text(
        "support",
        `${item.label} / ${item.detail}`,
        564,
        565 + i * 30,
        630,
        32,
        18,
        muted,
      ),
    );
    footerWidth = 0;
  } else if (slide.layout === "split") {
    photo(704, 0, 576, 720);
    label(recipe.domain, 64, 43, 600);
    title(slide.title, 60, 115, 610, 190, 48);
    text("body", slide.body, 64, 304, 575, 150, 29, fg, false, recipe.font);
    items.forEach((item, i) => {
      const y = 480 + i * 60;
      text("label", item.label, 64, y, 185, 56, 21, fg, true);
      text("detail", item.detail, 265, y, 380, 56, 21, muted);
    });
    footerWidth = 580;
  } else if (slide.layout === "cta") {
    const ink = contrastInk(accent);
    if (direction.cover === "gallery" || direction.cover === "panorama") {
      shape(864, 0, 416, 720, accent);
      label("The next chapter", 64, 46, 730);
      title(slide.title, 58, 150, 734, 290, 64);
      text("body", slide.body, 64, 484, 700, 134, 28, muted);
      items.forEach((item, i) => {
        const y = 111 + i * 180;
        shape(912, y, 304, 1, ink);
        text("action", item.label, 912, y + 25, 304, 67, 28, ink, true);
        text("detail", item.detail, 912, y + 94, 304, 82, 22, ink);
      });
      footerWidth = 730;
    } else {
      shape(0, 0, 1280, 720, accent);
      footerColor = ink;
      label("A clear next step", 64, 46, 1050, ink);
      title(slide.title, 58, 125, 1090, 195, 66, ink);
      text("body", slide.body, 64, 344, 940, 110, 28, ink);
      const width = 1152 / Math.max(1, count);
      items.forEach((item, i) => {
        const x = 64 + i * width;
        shape(x, 503, width - 30, 1, ink);
        text("action", item.label, x, 528, width - 35, 65, 28, ink, true);
        text("detail", item.detail, x, 594, width - 35, 65, 22, ink);
      });
    }
  } else {
    label(`${recipe.domain} / ${String(index + 1).padStart(2, "0")}`);
    title(slide.title);
    switch (slide.layout) {
      case "metrics": {
        text("intro", slide.body, 64, 211, 1100, 68, 25, muted);
        const width = 1152 / Math.max(1, count);
        items.forEach((item, i) => {
          const x = 64 + i * width;
          if (i) shape(x - 22, 320, 1, 285, rule);
          text(
            "metric",
            item.metric ?? String(i + 1),
            x,
            314,
            width - 42,
            134,
            90,
            i === 0 ? accent : fg,
            true,
          );
          text("label", item.label, x, 466, width - 42, 78, 30, fg, true);
          text("detail", item.detail, x, 557, width - 42, 82, 23, muted);
        });
        break;
      }
      case "cards":
      case "compare": {
        text("intro", slide.body, 64, 211, 1120, 68, 25, muted);
        const width = (1152 - (count - 1) * 32) / Math.max(1, count);
        items.forEach((item, i) => {
          const x = 64 + i * (width + 32),
            recommended = slide.layout === "compare" && i === 1;
          const ink = recommended ? contrastInk(accent) : fg;
          if (recommended) shape(x - 16, 304, width + 16, 336, accent);
          else shape(x, 304, width - 16, 2, rule);
          text(
            "index",
            recommended ? "RECOMMENDED" : String(i + 1).padStart(2, "0"),
            x,
            332,
            width - 30,
            36,
            18,
            recommended ? ink : accent,
            true,
          );
          text(
            "label",
            item.label,
            x,
            393,
            width - 30,
            104,
            34,
            ink,
            true,
            recipe.font,
          );
          text(
            "detail",
            item.detail,
            x,
            515,
            width - 30,
            117,
            24,
            recommended ? ink : muted,
          );
        });
        break;
      }
      case "chart": {
        nodes.push({
          id: uid("chart"),
          type: "chart",
          chart: {
            ...slide.chart,
            categories: [...slide.chart.categories],
            series: slide.chart.series.map((series, i) => ({
              ...series,
              values: [...series.values],
              color: i === 0 ? accent : blend(fg, bg, 0.47),
            })),
            colors: [
              accent,
              secondary,
              blend(fg, bg, 0.47),
              blend(fg, bg, 0.7),
            ],
          },
          frame: frame(64, 247, 820, 369),
          style: { fontFamily: "Arial", color: fg },
        });
        shape(930, 245, 1, 370, rule);
        text(
          "insight-label",
          "THE SIGNAL",
          969,
          248,
          240,
          30,
          16,
          accent,
          true,
        );
        text("insight", slide.body, 969, 298, 247, 322, 26, fg);
        text(
          "data-note",
          "Illustrative data / replace before use",
          64,
          633,
          790,
          25,
          16,
          muted,
        );
        break;
      }
      case "timeline": {
        text("intro", slide.body, 64, 211, 1100, 70, 25, muted);
        const width = 1152 / Math.max(1, count);
        items.forEach((item, i) => {
          const x = 64 + i * width;
          shape(x, 326, width - 24, 4, i === 0 ? accent : rule);
          text(
            "step",
            String(i + 1).padStart(2, "0"),
            x,
            353,
            width - 30,
            73,
            55,
            accent,
            false,
            recipe.font,
          );
          text("phase", item.label, x, 454, width - 35, 85, 29, fg, true);
          text("detail", item.detail, x, 548, width - 35, 104, 23, muted);
        });
        break;
      }
      case "process": {
        photo(887, 248, 329, 395);
        text("intro", slide.body, 64, 211, 1100, 65, 25, muted);
        const row = 355 / Math.max(1, count);
        items.forEach((item, i) => {
          const y = 298 + i * row;
          shape(64, y, 770, 1, rule);
          text(
            "step",
            String(i + 1).padStart(2, "0"),
            64,
            y + 20,
            85,
            65,
            42,
            accent,
            false,
            recipe.font,
          );
          text("phase", item.label, 173, y + 22, 260, row - 25, 27, fg, true);
          text("detail", item.detail, 462, y + 24, 365, row - 24, 22, muted);
        });
        break;
      }
      case "matrix":
        text("intro", slide.body, 64, 211, 1120, 60, 25, muted);
        items.forEach((item, i) => {
          const x = 64 + (i % 2) * 588,
            y = 301 + Math.floor(i / 2) * 177;
          shape(x, y, 552, 1, rule);
          text(
            "index",
            String(i + 1).padStart(2, "0"),
            x,
            y + 23,
            58,
            42,
            22,
            accent,
            true,
          );
          text("label", item.label, x + 72, y + 22, 470, 54, 30, fg, true);
          text("detail", item.detail, x + 72, y + 87, 470, 75, 23, muted);
        });
        break;
      case "agenda":
        text("intro", slide.body, 64, 211, 1120, 60, 25, muted);
        items.forEach((item, i) => {
          const y = 294 + i * 89;
          shape(64, y, 1152, 1, rule);
          text(
            "time",
            item.metric ?? String(i + 1).padStart(2, "0"),
            64,
            y + 21,
            170,
            55,
            32,
            accent,
            true,
          );
          text("label", item.label, 276, y + 23, 360, 60, 28, fg, true);
          text("detail", item.detail, 700, y + 24, 500, 61, 22, muted);
        });
        break;
      case "portfolio":
        text("intro", slide.body, 64, 211, 1120, 65, 25, muted);
        photo(64, 294, 704, 352);
        items.forEach((item, i) => {
          const y = 301 + i * 120;
          shape(818, y, 398, 1, rule);
          text("label", item.label, 818, y + 16, 390, 42, 28, fg, true);
          text("detail", item.detail, 818, y + 62, 390, 52, 21, muted);
        });
        break;
      case "quote":
        photo(905, 249, 311, 390);
        text(
          "quotation-mark",
          "“",
          63,
          220,
          130,
          150,
          120,
          accent,
          false,
          "Georgia",
        );
        text(
          "quote",
          slide.body,
          140,
          293,
          712,
          247,
          40,
          fg,
          false,
          recipe.font,
        );
        items.forEach((item, i) => {
          text(
            "attribution",
            item.label,
            143,
            559 + i * 42,
            680,
            39,
            22,
            fg,
            true,
          );
          text("context", item.detail, 143, 601 + i * 42, 680, 40, 19, muted);
        });
        break;
      case "code":
        shape(64, 246, 784, 393, panel);
        text(
          "code",
          slide.body,
          88,
          272,
          736,
          340,
          23,
          fg,
          false,
          "Courier New",
        );
        items.forEach((item, i) => {
          text("label", item.label, 907, 267 + i * 150, 298, 65, 28, fg, true);
          text("detail", item.detail, 907, 335 + i * 150, 298, 90, 23, muted);
        });
        break;
    }
  }
  if (footerWidth) {
    text(
      "footer",
      `${organization} / ${recipe.name}`,
      64,
      681,
      footerWidth,
      25,
      14,
      footerColor,
    );
    if (footerWidth > 900)
      text(
        "page",
        String(index + 1).padStart(2, "0"),
        1160,
        678,
        56,
        28,
        18,
        footerColor,
      );
  } else {
    text(
      "edition",
      `${recipe.name} / ${String(index + 1).padStart(2, "0")}`,
      slide.layout === "statement" ? 564 : 52,
      696,
      630,
      20,
      12,
      muted,
    );
  }
  return {
    id,
    title: slide.title.replace(/\n/g, " "),
    background: bg,
    notes: `${recipe.name} · ${recipe.domain}. Original editable template. Photography is AI-generated illustrative artwork, not documentation of a real place, product, person or project. All sample figures and organizations are illustrative. ${slide.body}\n${items.map((item) => `${item.label}: ${item.detail}`).join("\n")}`,
    content: { id: `${id}-canvas`, type: "canvas", children: nodes },
  };
}
