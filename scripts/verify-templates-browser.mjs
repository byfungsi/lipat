import { spawn } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createLipat } from "../packages/lipat/dist/index.js";

const server = spawn(
  process.execPath,
  [
    fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4185",
    "--strictPort",
  ],
  {
    cwd: new URL("../examples/react-demo", import.meta.url),
    stdio: ["ignore", "pipe", "pipe"],
  },
);
const unwrap = (result) => {
  if (!result.ok) throw Error(result.error.message);
  return result.value;
};
async function verifyLayerRows(page) {
  const layers = page.getByRole("navigation", { name: "Layers", exact: true });
  const rows = layers.getByRole("button");
  if ((await rows.count()) < 9)
    throw Error("Layers regression needs a crowded template slide");
  const clipped = await rows.evaluateAll((buttons) =>
    buttons.flatMap((button) => {
      const style = getComputedStyle(button);
      const height = button.getBoundingClientRect().height;
      const needed =
        parseFloat(style.lineHeight) +
        parseFloat(style.paddingTop) +
        parseFloat(style.paddingBottom) +
        parseFloat(style.borderTopWidth) +
        parseFloat(style.borderBottomWidth);
      return height + 1 < needed
        ? [{ text: button.textContent, height, needed }]
        : [];
    }),
  );
  if (clipped.length)
    throw Error(
      `Layers labels are vertically clipped: ${JSON.stringify(clipped)}`,
    );
  if (!(await layers.evaluate((node) => node.scrollHeight > node.clientHeight)))
    throw Error("Crowded Layers list should scroll");
  await rows.last().click();
  if ((await rows.last().getAttribute("aria-pressed")) !== "true")
    throw Error("Last layer cannot be selected after scrolling");
  await rows.first().focus();
  await rows.first().press("Enter");
  if ((await rows.first().getAttribute("aria-pressed")) !== "true")
    throw Error("First layer cannot be selected by keyboard");
}
let browser;
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4185/")).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    acceptDownloads: true,
  });
  const errors = [];
  page.setDefaultTimeout(8000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4185/?sample=templates");
  await page
    .getByRole("heading", { name: "Make room for a good story." })
    .waitFor();
  if ((await page.locator(".template-card").count()) !== 30)
    throw Error("Template gallery is incomplete");
  await page.getByRole("searchbox").fill("revenue");
  if ((await page.locator(".template-card").count()) !== 1)
    throw Error("Template search failed");
  await page
    .getByRole("button", { name: "Preview Revenue Pulse", exact: true })
    .click();
  const preview = page.getByRole("dialog");
  await preview.waitFor();
  await preview.getByRole("button", { name: "Next", exact: true }).click();
  await preview.getByRole("button", { name: "Next", exact: true }).click();
  if (
    !((await preview.locator("svg").getAttribute("aria-label")) ?? "").includes(
      "Recurring revenue",
    )
  )
    throw Error("Template preview Next navigation failed");
  await preview
    .getByRole("button", { name: "Use this template", exact: false })
    .click();
  await page.locator(".lipat-canvas svg[role=img]").waitFor();
  if (!page.url().includes("template=revenue-pulse"))
    throw Error("Using a template did not select its source");
  await verifyLayerRows(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await verifyLayerRows(page);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page
    .getByRole("button", { name: "Apply agent edit", exact: false })
    .click();
  if (await page.getByRole("alert").count())
    throw Error("Agent example could not target the template heading");
  await page.getByRole("button", { name: /^3\. Recurring revenue/ }).click();
  await page
    .getByRole("navigation", { name: "Layers", exact: true })
    .getByRole("button", { name: /^chart · revenue-pulse-slide-3-chart-/ })
    .click();
  await page
    .getByRole("combobox", { name: "Chart kind", exact: true })
    .selectOption("bar");
  await page
    .getByLabel("Chart data", { exact: true })
    .fill("Category\tAdjusted revenue\nJan\t11\nFeb\t22\nMar\t33");
  await page
    .getByRole("button", { name: "Apply properties", exact: true })
    .click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PPTX", exact: false }).click();
  const downloaded = await downloadEvent;
  const path = await downloaded.path();
  if (!path) throw Error("Template export download missing");
  const engine = unwrap(createLipat(readFileSync("packages/wasm/lipat.wasm")));
  const imported = unwrap(engine.parsePptx(readFileSync(path)));
  const chart = imported.scene.slides[2]?.elements.find(
    (e) => e.type === "chart",
  );
  if (
    chart?.chart.kind !== "bar" ||
    JSON.stringify(chart.chart.series[0].values) !== "[11,22,33]"
  )
    throw Error("Editor chart controls did not persist to native PPTX");
  mkdirSync("artifacts/template-review", { recursive: true });
  await page.screenshot({
    path: "artifacts/template-review/editor-chart.png",
    fullPage: true,
  });
  await page.goto("http://127.0.0.1:4185/?sample=charts-svg");
  const player = page.locator(".studio .lipat-player");
  await player.locator("svg[role=img]").waitFor();
  await player.getByRole("button", { name: "Next", exact: true }).click(); // reveal chart on first slide
  if ((await player.locator('[data-node-id="chart-data-0"] rect').count()) < 4)
    throw Error("Chart reveal did not draw marks");
  await player.getByRole("button", { name: "Next", exact: true }).click(); // next chart kind
  if (
    !(
      await player.locator("svg[role=img]").getAttribute("aria-label")
    ).includes("bar chart")
  )
    throw Error("Chart sample Next did not advance to the next slide");
  if (!(await player.locator("linearGradient").count()))
    throw Error("SVG asset missing from chart sample");
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "Browser: 30-template gallery search, six-slide preview, template source/agent edit, spreadsheet chart controls, native PPTX download and animated chart/SVG Next navigation passed.",
  );
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
