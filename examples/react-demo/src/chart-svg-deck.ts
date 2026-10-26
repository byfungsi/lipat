import type { ChartData, DeckInput } from "@byfungsi/lipat";
import { createSvgAsset } from "@byfungsi/lipat/images";

/** Charts and SVG sample uses the same editable data for preview, PowerPoint and native hosts. */
export const chartSvgDeck: DeckInput = {
  id: "charts-svg-sample",
  title: "Charts & SVG",
  assets: [
    createSvgAsset({
      id: "sample-mark",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><linearGradient id="g"><stop offset="0" stop-color="#5856D6"/><stop offset="1" stop-color="#16A085"/></linearGradient></defs><rect x="10" y="10" width="140" height="140" rx="32" fill="url(#g)"/><path d="M 45 105 V 75 M 80 105 V 50 M 115 105 V 65" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/></svg>',
    }),
  ],
  slides: (["column", "bar", "line", "area", "pie", "doughnut"] as const).map(
    (kind, index) => {
      const circular = kind === "pie" || kind === "doughnut";
      const chart: ChartData = {
        kind,
        categories: circular
          ? ["Core", "Growth", "Partners"]
          : ["Q1", "Q2", "Q3", "Q4"],
        series: circular
          ? [{ name: "Revenue mix (sample %)", values: [50, 32, 18] }]
          : [
              {
                name: "Revenue (sample $k)",
                values: [24, 38, 52, 70],
                color: "#5856D6",
              },
              {
                name: "Costs (sample $k)",
                values: [18, 24, 31, 39],
                color: "#16A085",
              },
            ],
        showValues: true,
      };
      return {
        id: `chart-slide-${index}`,
        title: `${kind} chart`,
        notes:
          "Illustrative sample values. Charts export as native PowerPoint charts with embedded editable XLSX. SVG artwork exports as vector plus PNG fallback.",
        content: {
          id: `chart-canvas-${index}`,
          type: "canvas",
          children: [
            {
              id: `chart-title-${index}`,
              type: "heading",
              text: `Editable ${kind} chart`,
              frame: { x: 40, y: 30, width: 770, height: 65 },
              style: { fontSize: 38 },
            },
            {
              id: `chart-data-${index}`,
              type: "chart",
              chart,
              frame: { x: 40, y: 125, width: 750, height: 350 },
              step: 1,
              animation: { effect: "fade" },
            },
            {
              id: `chart-mark-${index}`,
              type: "image",
              assetId: "sample-mark",
              alt: "Original gradient bar-chart SVG icon",
              frame: { x: 825, y: 35, width: 90, height: 90 },
            },
            {
              id: `chart-caption-${index}`,
              type: "text",
              text: "Illustrative data · native charts, embedded workbook, vector SVG",
              frame: { x: 40, y: 490, width: 850, height: 32 },
              style: { fontSize: 16 },
            },
          ],
        },
      };
    },
  ),
};
