import type { ChartData, LipatResult } from "@lipat-internal/model";

/** Format chart data as spreadsheet-friendly tab-separated rows, quoting embedded tabs, newlines and quotes. */
export function formatChartTable(chart: ChartData): string {
  const cell = (value: string) =>
    /[\t\r\n"]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  return [
    ["Category", ...chart.series.map((s) => s.name)],
    ...chart.categories.map((name, i) => [
      name,
      ...chart.series.map((s) => String(s.values[i] ?? "")),
    ]),
  ]
    .map((row) => row.map(cell).join("\t"))
    .join("\n");
}

/** Parse a pasted chart table into the existing chart, preserving kind, colors and display settings; invalid data remains a Result. */
export function parseChartTable(
  table: string,
  chart: ChartData,
): LipatResult<ChartData> {
  const invalid = (message: string): LipatResult<never> => ({
    ok: false,
    error: { reason: "invalidChartData", message: `Chart table: ${message}` },
  });
  if (table.length > 1_000_000)
    return invalid("input exceeds one million characters");
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false,
    closed = false;
  for (let i = 0; i < table.length; i++) {
    const c = table[i];
    if (quoted) {
      if (c === '"') {
        if (table[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += c;
    } else if (c === '"') {
      if (cell || closed) return invalid("quotes must enclose the entire cell");
      quoted = true;
    } else if (c === "\t" || c === "\n" || c === "\r") {
      row.push(cell);
      cell = "";
      closed = false;
      if (row.length > 33) return invalid("at most 32 series are supported");
      if (c !== "\t") {
        if (c === "\r" && table[i + 1] === "\n") i++;
        rows.push(row);
        row = [];
      }
      if (rows.length > 1001)
        return invalid("at most 1000 categories are supported");
    } else {
      if (closed) return invalid("unexpected content after a closing quote");
      cell += c;
    }
  }
  if (quoted) return invalid("a quoted cell is not closed");
  if (cell || row.length || closed) {
    row.push(cell);
    rows.push(row);
  }
  const header = rows[0];
  if (
    !header ||
    header.length < 2 ||
    header.length > 33 ||
    rows.length < 2 ||
    rows.length > 1001 ||
    rows.some((row) => row.length !== header.length)
  )
    return invalid(
      "include a header, one or more categories, and the same number of columns in every row",
    );
  const data = rows.slice(1),
    series = header.slice(1).map((name, i) => ({
      name,
      values: data.map((row) => {
        const value = row[i + 1]?.trim();
        return value ? Number(value) : NaN;
      }),
      ...(chart.series[i]?.color ? { color: chart.series[i].color } : {}),
    }));
  if (
    series.some((s) =>
      s.values.some((v) => !Number.isFinite(v) || Math.abs(v) > 1e12),
    )
  )
    return invalid(
      "every value must be a finite number between −1e12 and 1e12",
    );
  return {
    ok: true,
    value: { ...chart, categories: data.map((row) => row[0] ?? ""), series },
  };
}
