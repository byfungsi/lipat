# Charts

Available in `@byfungsi/lipat` 0.7.0 and later.

Charts are editable document nodes. The Rust compiler carries their data into the scene, the SVG renderers draw the same data, and the PPTX writer creates native PowerPoint charts with an embedded XLSX workbook. Browser, WASM, workerd and the native Rust engine share this contract. No chart service or browser canvas is required.

```ts
import { createDeck } from "@byfungsi/lipat";

const result = createDeck(
  {
    id: "quarterly-review",
    slides: [
      {
        id: "revenue",
        content: {
          id: "revenue-chart",
          type: "chart",
          chart: {
            kind: "column",
            title: "Revenue by quarter ($k)",
            categories: ["Q1", "Q2", "Q3", "Q4"],
            series: [
              { name: "Revenue", values: [24, 38, 52, 70], color: "#5856D6" },
              { name: "Costs", values: [18, 24, 31, 39], color: "#16A085" },
            ],
            showLegend: true,
            showValues: false,
          },
        },
      },
    ],
  },
  { engine },
); // initialize engine explicitly; see /wasm
```

`kind` supports `column`, `bar`, `line`, `area`, `pie` and `doughnut`. Column, bar and area support `stacked: true`, including separate positive and negative stacks. Pie and doughnut require exactly one nonnegative series with a positive total. Every series must have one finite value per category. Values are bounded to ±1e12; there are at most 1,000 categories and 32 series per chart. `colors` optionally supplies a cycling palette; a series' explicit `color` takes priority for Cartesian charts.

Use descriptive series names and include units in the title or nearby editable text. Bar and column previews include zero in the numeric scale. Small chart frames ask the viewer to enlarge the chart; crowded category tick labels and long legend text are condensed in previews. Keep presentation charts focused: a handful of categories and series communicates more clearly than a spreadsheet-sized chart.

## Edit chart data

```ts
if (result.ok) {
  const edit = result.value.apply([
    {
      type: "setChartData",
      nodeId: "revenue-chart",
      chart: {
        kind: "line",
        categories: ["Q1", "Q2", "Q3"],
        series: [{ name: "Revenue ($k)", values: [24, 38, 52] }],
      },
    },
  ]);
  // Check edit.ok. Invalid batches preserve the previous document and history.
}
```

The web and React Native editors include chart kind, title, legend, values, stacking and spreadsheet-paste controls. `formatChartTable` and `parseChartTable` in `/core` expose the same tab-separated editing format, including quoted tabs, newlines and quotation marks in labels. Parsing returns a `LipatResult`; full document validation enforces chart-kind and host limits afterward.

## PowerPoint and imported charts

Export writes DrawingML chart parts with cached category/series values and a separate embedded XLSX workbook per chart. The workbook supplies PowerPoint's **Edit Data** source. Charts remain chart objects rather than pictures or individual bar shapes. Leaf animation/reveal instructions target the whole chart.

Import reads supported 2D category charts from their cached values. It does not evaluate formulas or fetch external workbooks. Complete caches are required. Unsupported 3D, combined, sparse, percent-stacked or logarithmic charts are reported as `unsupportedChart`. Supported imported data uses Lipat's presentation defaults, with a `chartFormatting` diagnostic for formatting, axis and label differences. Arbitrary source chart parts are not preserved.

`maxChartPoints` limits category × series values cumulatively across a document or imported presentation. Its hard ceiling/default is 100,000; hosts may lower it, including to zero. Existing text, XML, request and package budgets also apply. Export checks generated package entry, expanded-byte and compressed-byte budgets.

[Try the charts and SVG sample](./playground/index.html?sample=charts-svg) or choose a complete deck from the [template gallery](./playground/index.html?sample=templates).
