import { spawn } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  presentationTemplates,
  presentationTemplateCategories,
} from "../packages/lipat/dist/templates.js";
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
  if ((await page.locator(".template-card").count()) !== 60)
    throw Error("Template gallery is incomplete");
  const categories = page.getByRole("navigation", {
    name: "Template categories",
  });
  for (const category of presentationTemplateCategories) {
    await categories
      .getByRole("button", {
        name: new RegExp(
          `^${category.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        ),
      })
      .click();
    const cards = page.locator(".template-card");
    const expected = presentationTemplates.filter(
      (template) => template.category === category.id,
    ).length;
    if (
      (await cards.count()) !== expected ||
      (await cards
        .filter({
          has: page.locator(
            `[data-category]:not([data-category="${category.id}"])`,
          ),
        })
        .count())
    )
      throw Error(`Category filter failed: ${category.id}`);
    if (
      !(await cards.evaluateAll(
        (nodes, id) =>
          nodes.every((node) => node.getAttribute("data-category") === id),
        category.id,
      ))
    )
      throw Error("Category contains unrelated templates");
  }
  await categories.getByRole("button", { name: /^Tech talks/ }).click();
  await page.getByRole("searchbox").fill("lightning");
  if ((await page.locator(".template-card").count()) !== 1)
    throw Error("Category and search do not combine");
  await page
    .getByRole("button", { name: "Preview Tech Lightning", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Next", exact: true })
    .click();
  if (
    !(
      await page
        .getByRole("dialog")
        .locator("svg[role=img]")
        .getAttribute("aria-label")
    )?.includes("retry")
  )
    throw Error("New tech template preview did not navigate");
  await page
    .getByRole("button", { name: "Close template preview", exact: true })
    .click();
  await categories.getByRole("button", { name: /^All templates/ }).click();
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
  const thumbnails = page.getByRole("navigation", {
    name: "Slides",
    exact: true,
  });
  if ((await thumbnails.locator(".lipat-slide-thumbnail svg").count()) !== 6)
    throw Error("Filmstrip is missing rendered previews");
  await thumbnails.getByRole("button").nth(1).click();
  await thumbnails.getByRole("button").nth(1).press("ArrowDown");
  if (
    (await thumbnails
      .getByRole("button")
      .nth(2)
      .getAttribute("aria-current")) !== "page"
  )
    throw Error("Filmstrip keyboard navigation failed");
  await thumbnails.getByRole("button").first().click();
  const layout = await page.locator(".lipat-workspace").evaluate((root) => {
    const rail = root
      .querySelector(".lipat-slide-rail")
      .getBoundingClientRect();
    const canvas = root.querySelector(".lipat-canvas").getBoundingClientRect();
    const stage = root.querySelector(".lipat-stage").getBoundingClientRect();
    const sidebar = root
      .querySelector(".lipat-sidebar")
      .getBoundingClientRect();
    const notes = root
      .querySelector(".lipat-notes-panel")
      .getBoundingClientRect();
    return {
      fits:
        canvas.x >= rail.right &&
        canvas.right <= sidebar.x &&
        canvas.y >= stage.y &&
        canvas.bottom <= stage.bottom + 1 &&
        notes.y >= canvas.bottom,
      width: canvas.width,
      height: canvas.height,
    };
  });
  if (!layout.fits || layout.width < 400 || layout.height < 200)
    throw Error(`Editor does not fit the slide: ${JSON.stringify(layout)}`);
  mkdirSync("artifacts/editor-60", { recursive: true });
  await page.screenshot({
    path: "artifacts/editor-60/desktop.png",
    fullPage: false,
  });
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
    "Browser: 60-template categories/search, new tech preview, fitted canvas/filmstrip keyboard navigation, gallery search, six-slide preview, template source/agent edit, spreadsheet chart controls, native PPTX download and animated chart/SVG Next navigation passed.",
  );
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
