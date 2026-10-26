import type { ChartData } from "@lipat-internal/model";
import type { TemplateItem, TemplateSlideRecipe } from "./template-types";

/** Internal narrative item expands to editable text, with an optional metric or time label. */
export function templateItem(
  label: string,
  detail: string,
  metric?: string,
): TemplateItem {
  return { label, detail, ...(metric ? { metric } : {}) };
}
/** Internal cover recipe keeps the full statement, context and audience label separate. */
export function templateCover(
  title: string,
  body: string,
  label: string,
): TemplateSlideRecipe {
  return { layout: "cover", title, body, label };
}
/** Internal evidence recipe stores category data rather than a picture of a chart. */
export function templateChart(
  kind: ChartData["kind"],
  title: string,
  body: string,
  categories: readonly string[],
  series: ChartData["series"],
): TemplateSlideRecipe {
  return {
    layout: "chart",
    title,
    body,
    chart: { kind, categories, series, showLegend: true, showValues: false },
  };
}
/** Internal content recipe selects a composition suited to the narrative role. */
export function templateContent(
  layout: Exclude<TemplateSlideRecipe["layout"], "cover" | "chart">,
  title: string,
  body: string,
  items: readonly TemplateItem[] = [],
): TemplateSlideRecipe {
  return { layout, title, body, items };
}
