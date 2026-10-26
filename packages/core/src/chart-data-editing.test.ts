import { expect, it } from "vitest";
import fc from "fast-check";
import { formatChartTable, parseChartTable } from "./chart-data-editing";
import type { ChartData } from "@lipat-internal/model";

it("round-trips pasted spreadsheet chart tables, including quoted labels, Unicode and negative values", () => {
  fc.assert(
    fc.property(
      fc.array(fc.tuple(fc.string({ maxLength: 20 }), fc.integer()), {
        minLength: 1,
        maxLength: 15,
      }),
      (rows) => {
        const chart: ChartData = {
          kind: "line",
          title: "Keep my settings",
          categories: rows.map((r) => r[0]),
          series: [
            {
              name: 'A\t"quoted"\nseries',
              values: rows.map((r) => r[1]),
              color: "#123456",
            },
          ],
          showLegend: false,
        };
        expect(parseChartTable(formatChartTable(chart), chart)).toEqual({
          ok: true,
          value: chart,
        });
      },
    ),
    { numRuns: 50 },
  );
});
it.each([
  "Category\tRevenue\nQ1\t",
  "Category\tRevenue\nQ1\tNaN",
  "Category\tRevenue\nQ1\tInfinity",
  'Category\tRevenue\n"Q1\t12',
  "Category\tRevenue\nQ1\t12\textra",
  'Category\tRevenue\n"Q1"x\t12',
])("returns actionable chart table errors for malformed data: %s", (table) => {
  expect(
    parseChartTable(table, {
      kind: "column",
      categories: ["Q1"],
      series: [{ name: "Revenue", values: [12] }],
    }),
  ).toMatchObject({
    ok: false,
    error: {
      reason: "invalidChartData",
      message: expect.stringContaining("Chart table:"),
    },
  });
});
