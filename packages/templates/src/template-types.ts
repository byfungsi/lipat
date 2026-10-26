import type { ChartData } from "@lipat-internal/model";

/** Presentation template metadata is available without an engine, renderer, or network. */
export interface PresentationTemplateInfo {
  readonly id: string;
  readonly name: string;
  readonly domain: string;
  readonly description: string;
  readonly palette: readonly [string, string, string, string];
  readonly slideCount: 6;
  readonly slideTitles: readonly string[];
}
/** Options customize deck identity and editable cover/footer text; every call creates independent source data. */
export interface PresentationTemplateOptions {
  readonly id?: string;
  readonly title?: string;
  readonly organization?: string;
}
/** Internal content recipe items remain ordinary editable text in the resulting deck. */
export interface TemplateItem {
  readonly label: string;
  readonly detail: string;
  readonly metric?: string;
}
/** Internal slide recipes choose compositions by content role rather than a palette-only theme. */
export type TemplateSlideRecipe =
  | {
      readonly layout: "cover";
      readonly title: string;
      readonly body: string;
      readonly label: string;
    }
  | {
      readonly layout: "chart";
      readonly title: string;
      readonly body: string;
      readonly chart: ChartData;
    }
  | {
      readonly layout:
        | "cards"
        | "compare"
        | "metrics"
        | "timeline"
        | "process"
        | "matrix"
        | "agenda"
        | "portfolio";
      readonly title: string;
      readonly body: string;
      readonly items: readonly TemplateItem[];
    }
  | {
      readonly layout: "statement" | "split" | "quote" | "code" | "cta";
      readonly title: string;
      readonly body: string;
      readonly items?: readonly TemplateItem[];
    };
/** Internal design recipe; the public factory returns expanded, editable nodes, never recipes or executable document code. */
export interface TemplateRecipe {
  readonly id: string;
  readonly name: string;
  readonly domain: string;
  readonly description: string;
  readonly palette: readonly [string, string, string, string];
  readonly font: "Arial" | "Georgia";
  readonly slides: readonly [
    TemplateSlideRecipe,
    TemplateSlideRecipe,
    TemplateSlideRecipe,
    TemplateSlideRecipe,
    TemplateSlideRecipe,
    TemplateSlideRecipe,
  ];
}
