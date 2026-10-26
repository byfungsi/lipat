import type { ChartData, SceneElement } from "@lipat-internal/model";
import { escapeSlideMarkup } from "./markup-escape";

const palette = [
  "#5856D6",
  "#16A085",
  "#F2A541",
  "#E56476",
  "#3887BE",
  "#8B6BB1",
];
function chartColor(chart: ChartData, index: number): string {
  const value =
    chart.series[index]?.color ??
    chart.colors?.[index % chart.colors.length] ??
    palette[index % palette.length];
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : "#5856D6";
}
function compactValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${+(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${+(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${+(value / 1e3).toFixed(1)}k`;
  return `${+value.toFixed(2)}`;
}
function shorten(text: string, max = 16): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Render editable chart data as portable SVG marks; no browser, network or chart-library runtime is needed. */
export function renderChartSvg(
  element: Extract<SceneElement, { type: "chart" }>,
): string {
  const chart = element.chart,
    f = element.frame;
  // Scene-only viewers also accept immutable host data. Fail closed on malformed or excessive chart input.
  const circular = chart.kind === "pie" || chart.kind === "doughnut";
  if (
    !chart.categories.length ||
    !chart.series.length ||
    chart.categories.length > 1000 ||
    chart.series.length > 32 ||
    chart.categories.length * chart.series.length > 100_000 ||
    chart.series.some(
      (s) =>
        s.values.length !== chart.categories.length ||
        s.values.some((v) => !Number.isFinite(v) || Math.abs(v) > 1e12),
    ) ||
    (circular &&
      (chart.series.length !== 1 ||
        chart.series.some((s) => s.values.some((v) => v < 0))))
  )
    return "";
  const font = Math.min(18, Math.max(10, f.width / 42));
  const fg = /^#[0-9a-f]{6}$/i.test(element.style.color ?? "")
    ? element.style.color
    : "#172033";
  const family = escapeSlideMarkup(element.style.fontFamily ?? "Arial");
  const text = (
    x: number,
    y: number,
    value: string,
    anchor = "start",
    size = font,
    weight = 400,
  ) =>
    `<text x="${x}" y="${y}" fill="${fg}" font-family="${family}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${escapeSlideMarkup(value)}</text>`;
  const legendItems = circular
    ? chart.categories
    : chart.series.map((s) => s.name);
  const legendColumns = Math.max(1, Math.floor(f.width / 145)),
    legendRows = Math.ceil(legendItems.length / legendColumns);
  const legendHeight =
    chart.showLegend === false ? 0 : Math.min(legendRows, 4) * (font + 10) + 8;
  const titleHeight = chart.title ? font * 2.5 : 8;
  const top = f.y + titleHeight,
    bottom = f.y + f.height - legendHeight - font * 2.5;
  if (f.width < 100 || bottom - top < 36)
    return text(f.x + 8, f.y + 20, "Enlarge chart to show data");
  let body = chart.title
    ? text(f.x + 4, f.y + font * 1.4, chart.title, "start", font * 1.3, 700)
    : "";
  const legendColor = (i: number) =>
    circular ? chartColor({ ...chart, series: [] }, i) : chartColor(chart, i);
  if (chart.showLegend !== false) {
    legendItems.slice(0, legendColumns * 4).forEach((name, i) => {
      const x = f.x + (i % legendColumns) * (f.width / legendColumns),
        y =
          f.y +
          f.height -
          legendHeight +
          12 +
          Math.floor(i / legendColumns) * (font + 10);
      body += `<rect x="${x}" y="${y - font + 1}" width="${font - 2}" height="${font - 2}" rx="2" fill="${legendColor(i)}"/>${text(x + font + 5, y, shorten(name, 19))}`;
    });
  }
  if (circular) {
    const values = chart.series[0]?.values ?? [],
      total = values.reduce((a, b) => a + b, 0);
    if (total <= 0) return "";
    const cx = f.x + f.width / 2,
      cy = (top + bottom) / 2,
      r = Math.min(f.width * 0.38, (bottom - top) * 0.48);
    let angle = -Math.PI / 2;
    values.forEach((value, i) => {
      if (value <= 0) return;
      const span = (value / total) * Math.PI * 2,
        end = angle + span;
      const x1 = cx + r * Math.cos(angle),
        y1 = cy + r * Math.sin(angle),
        x2 = cx + r * Math.cos(end),
        y2 = cy + r * Math.sin(end);
      const title = `<title>${escapeSlideMarkup(chart.categories[i] ?? "")}: ${value}</title>`;
      const color = legendColor(i);
      if (span >= Math.PI * 2 - 1e-10)
        body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}">${title}</circle>`;
      else
        body += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${span > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z" fill="${color}">${title}</path>`;
      if (chart.showValues && span > 0.26)
        body += text(
          cx + r * 0.76 * Math.cos(angle + span / 2),
          cy + r * 0.76 * Math.sin(angle + span / 2) + font / 3,
          `${Math.round((value / total) * 100)}%`,
          "middle",
          font,
        );
      angle = end;
    });
    // A mask keeps the doughnut hole transparent on any slide background.
    if (chart.kind === "doughnut") {
      const id = `chart-hole-${Array.from(element.id)
        .map((c) => c.codePointAt(0)?.toString(16))
        .join("-")}-${[f.x, f.y, f.width, f.height, cx, cy, r].join("_")}`;
      body = `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="${f.x}" y="${f.y}" width="${f.width}" height="${f.height}"><rect x="${f.x}" y="${f.y}" width="${f.width}" height="${f.height}" fill="white"/><circle cx="${cx}" cy="${cy}" r="${r * 0.58}" fill="black"/></mask></defs><g mask="url(#${id})">${body}</g>`;
    }
  } else {
    const horizontal = chart.kind === "bar";
    const left = f.x + (horizontal ? Math.min(f.width * 0.27, 110) : 52),
      right = f.x + f.width - 20;
    const pw = right - left,
      ph = bottom - top;
    const positive = chart.categories.map((_, i) =>
      chart.series.reduce((sum, s) => sum + Math.max(0, s.values[i] ?? 0), 0),
    );
    const negative = chart.categories.map((_, i) =>
      chart.series.reduce((sum, s) => sum + Math.min(0, s.values[i] ?? 0), 0),
    );
    const values = chart.series.flatMap((s) => s.values),
      rawMin = Math.min(0, ...(chart.stacked ? negative : values)),
      rawMax = Math.max(0, ...(chart.stacked ? positive : values));
    const min = rawMin,
      max = rawMax === min ? min + 1 : rawMax,
      range = max - min;
    const scale = (v: number) =>
      horizontal
        ? left + ((v - min) / range) * pw
        : bottom - ((v - min) / range) * ph;
    for (let i = 0; i <= 4; i++) {
      const v = min + (range * i) / 4,
        p = scale(v);
      body += horizontal
        ? `<line x1="${p}" x2="${p}" y1="${top}" y2="${bottom}" stroke="${fg}" stroke-opacity=".12"/>${text(p, bottom + font + 7, compactValue(v), "middle")}`
        : `<line x1="${left}" x2="${right}" y1="${p}" y2="${p}" stroke="${fg}" stroke-opacity=".12"/>${text(left - 9, p + font / 3, compactValue(v), "end")}`;
    }
    const count = chart.categories.length,
      slot = (horizontal ? ph : pw) / count;
    const category = (i: number) =>
      horizontal ? top + slot * (i + 0.5) : left + slot * (i + 0.5);
    const categoryInterval = Math.max(
      1,
      Math.ceil(count / (horizontal ? 12 : 10)),
    );
    chart.categories.forEach((name, i) => {
      if (i % categoryInterval === 0)
        body += horizontal
          ? text(left - 9, category(i) + font / 3, shorten(name, 14), "end")
          : text(category(i), bottom + font + 7, shorten(name, 12), "middle");
    });
    const positiveBase = chart.categories.map(() => 0),
      negativeBase = chart.categories.map(() => 0);
    chart.series.forEach((series, si) => {
      const color = chartColor(chart, si),
        points: string[] = [],
        bases: string[] = [];
      series.values.forEach((v, i) => {
        const base = chart.stacked
            ? v >= 0
              ? (positiveBase[i] ?? 0)
              : (negativeBase[i] ?? 0)
            : 0,
          value = base + v;
        if (chart.stacked) {
          if (v >= 0) positiveBase[i] = value;
          else negativeBase[i] = value;
        }
        const p = scale(value),
          zero = scale(base),
          c = category(i);
        const title = `<title>${escapeSlideMarkup(series.name)} · ${escapeSlideMarkup(chart.categories[i] ?? "")}: ${v}</title>`;
        if (chart.kind === "column" || chart.kind === "bar") {
          const bands = chart.stacked ? 1 : chart.series.length,
            band = (slot * 0.72) / bands,
            offset = chart.stacked ? 0 : si * band;
          body += horizontal
            ? `<rect x="${Math.min(p, zero)}" y="${c - slot * 0.36 + offset}" width="${Math.abs(p - zero)}" height="${Math.max(0.1, band - 1)}" fill="${color}">${title}</rect>`
            : `<rect x="${c - slot * 0.36 + offset}" y="${Math.min(p, zero)}" width="${Math.max(0.1, band - 1)}" height="${Math.abs(p - zero)}" fill="${color}">${title}</rect>`;
        } else {
          points.push(`${c},${p}`);
          bases.unshift(`${c},${zero}`);
          if (chart.kind === "line")
            body += `<circle cx="${c}" cy="${p}" r="3" fill="${color}">${title}</circle>`;
        }
        if (chart.showValues && count * chart.series.length <= 40)
          body += horizontal
            ? text(Math.min(right - 4, p + 6), c + font / 3, compactValue(v))
            : text(c, Math.max(top + font, p - 6), compactValue(v), "middle");
      });
      if (chart.kind === "line")
        body += `<polyline points="${points.join(" ")}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
      if (chart.kind === "area")
        body += `<polygon points="${[...points, ...bases].join(" ")}" fill="${color}" fill-opacity=".6" stroke="${color}" stroke-width="1.5"/>`;
    });
    body += horizontal
      ? `<line x1="${scale(0)}" x2="${scale(0)}" y1="${top}" y2="${bottom}" stroke="${fg}" stroke-opacity=".4"/>`
      : `<line x1="${left}" x2="${right}" y1="${scale(0)}" y2="${scale(0)}" stroke="${fg}" stroke-opacity=".4"/>`;
  }
  const description = chart.series
    .map(
      (s) =>
        `${s.name}: ${chart.categories.map((c, i) => `${c} ${s.values[i]}`).join(", ")}`,
    )
    .join("; ");
  return `<g role="img" aria-label="${escapeSlideMarkup(chart.title || `${chart.kind} chart`)}"><desc>${escapeSlideMarkup(description)}</desc>${body}</g>`;
}
