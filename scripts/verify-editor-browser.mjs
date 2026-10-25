import { build } from "esbuild";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync, mkdirSync } from "node:fs";
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
    "4184",
    "--strictPort",
  ],
  {
    cwd: new URL("../examples/react-demo/", import.meta.url),
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let browser;
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4184")).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    acceptDownloads: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4184/");
  await page.locator(".lipat-canvas svg").waitFor();
  await page.evaluate(() => document.fonts.ready);
  const palette = page.getByRole("toolbar", { name: "Insert content" }),
    stage = page.locator(".lipat-canvas");
  await palette
    .getByRole("button", { name: "Add shape", exact: true })
    .dragTo(stage, { targetPosition: { x: 160, y: 100 } });
  const shape = page.getByRole("button", { name: /^Select lipat-shape-/ });
  await shape.waitFor({ timeout: 5000 }).catch(async (error) => {
    console.log(
      "Editor drop diagnostics",
      await page.locator("[role=alert]").allTextContents(),
      await page
        .locator("[data-node-id]")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-node-id")),
        ),
    );
    await page.screenshot({
      path: "artifacts/editor-drop-failure.png",
      fullPage: true,
    });
    throw error;
  });
  const id = (await shape.getAttribute("aria-label")).slice("Select ".length);
  await page
    .getByLabel("Entrance effect", { exact: true })
    .selectOption("zoom");
  await page.getByLabel("Reveal step", { exact: true }).fill("1");
  await page.getByLabel("Animation duration", { exact: true }).fill("600");
  await page.getByLabel("Animation delay", { exact: true }).fill("25");
  await page
    .getByLabel("Animation easing", { exact: true })
    .selectOption("linear");
  await page
    .getByRole("button", { name: "Apply properties", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const saved = await downloadPromise;
  const document = JSON.parse(readFileSync(await saved.path(), "utf8"));
  const node = document.slides[0].content.children.find(
    (node) => node.id === id,
  );
  if (
    node?.animation?.effect !== "zoom" ||
    node.step !== 1 ||
    node.animation.durationMs !== 600
  )
    throw Error("Host Save did not receive edited timing");
  const exportPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export PPTX ↗", exact: true })
    .click();
  const exported = await exportPromise;
  const initialized = createLipat(
    new Uint8Array(readFileSync("packages/lipat/dist/lipat.wasm")),
  );
  if (!initialized.ok) throw Error(initialized.error.message);
  const imported = initialized.value.parsePptx(
    new Uint8Array(readFileSync(await exported.path())),
  );
  if (!imported.ok) throw Error(imported.error.message);
  if (
    !imported.value.scene.slides[0].elements.some(
      (element) =>
        element.animation?.effect === "zoom" &&
        element.animation.durationMs === 600,
    )
  )
    throw Error("Native PPTX export lost editor timing");
  await page
    .getByRole("button", { name: "Preview animations", exact: true })
    .click();
  const preview = page.getByRole("region", { name: "Animation preview" });
  await preview.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForTimeout(750);
  const box = await preview.locator(`[data-playback-id="${id}"]`).boundingBox();
  if (!box || box.width < 1 || box.height < 1)
    throw Error("Editor animation preview lost geometry");
  await page
    .getByRole("button", { name: "Close preview", exact: true })
    .click();
  await page
    .getByLabel("Upload image file", { exact: true })
    .setInputFiles("examples/react-demo/public/images/fold.png");
  await page.getByRole("button", { name: /^Select lipat-image-/ }).waitFor();
  const finalSave = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const imageDocument = JSON.parse(
    readFileSync(await (await finalSave).path(), "utf8"),
  );
  if (
    !imageDocument.assets.some(
      (asset) => asset.mimeType === "image/png" && asset.data.length > 0,
    )
  )
    throw Error("Image upload did not produce an embedded asset");
  mkdirSync("artifacts", { recursive: true });
  await page.screenshot({
    path: "artifacts/editor-feature-complete.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/editor-mobile.png",
    fullPage: true,
  });
  const bundle = await build({
    entryPoints: ["tests/browser-default-editor-entry.tsx"],
    bundle: true,
    format: "esm",
    platform: "browser",
    write: false,
    metafile: true,
  });
  if (
    Object.keys(bundle.metafile.inputs).some((path) =>
      path.includes("node_modules/motion/"),
    )
  )
    throw Error("Default editor imported optional Motion");
  await page.route("**/default-editor", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<div id="root"></div><script type="module" src="/default-editor.mjs"></script>',
    }),
  );
  await page.route("**/default-editor.mjs", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: bundle.outputFiles[0].text,
    }),
  );
  await page.route("**/test-wasm", (route) =>
    route.fulfill({
      contentType: "application/wasm",
      body: readFileSync("packages/lipat/dist/lipat.wasm"),
    }),
  );
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("http://127.0.0.1:4184/default-editor");
  await page
    .getByRole("button", { name: "Preview animations", exact: true })
    .click();
  await page
    .getByRole("region", { name: "Animation preview" })
    .getByRole("button", { name: "Next", exact: true })
    .click();
  await page.waitForTimeout(100);
  const animated = page.locator('.lipat-player [data-playback-id="zoom"]');
  if (!(await animated.evaluate((node) => node.getAnimations().length > 0)))
    throw Error("Default editor did not start browser animation");
  const animatedBox = await animated.boundingBox();
  if (!animatedBox || animatedBox.width < 1 || animatedBox.height < 1)
    throw Error("Default browser animation lost SVG geometry");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: "Replay animations", exact: true })
    .click();
  await page
    .getByRole("region", { name: "Animation preview" })
    .getByRole("button", { name: "Next", exact: true })
    .click();
  if (await animated.evaluate((node) => node.getAnimations().length !== 0))
    throw Error("Default browser animation ignored reduced motion");
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "Built-in editor Chromium: palette drag/drop, animation properties and Motion preview, host Save snapshot, embedded file upload and native PPTX animation export passed.",
  );
} finally {
  await browser?.close();
  server.kill();
}
