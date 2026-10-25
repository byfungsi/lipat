import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
const server = spawn(
  process.execPath,
  [
    fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4178",
    "--strictPort",
  ],
  {
    cwd: new URL("../examples/react-demo/", import.meta.url),
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let browser;
let docsServer;
const imageServer = createServer((_request, response) => {
  response.setHeader("content-type", "image/png");
  response.end(readFileSync("examples/react-demo/public/images/fold.png"));
});
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      const response = await fetch("http://127.0.0.1:4178");
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!ready) throw new Error("Demo preview server did not become ready");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4178");
  await page
    .getByRole("heading", { name: "Give your ideas some room." })
    .waitFor();
  await page.locator(".lipat-canvas svg").waitFor();
  mkdirSync("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/demo-desktop.png", fullPage: true });
  const headline = page.getByRole("button", {
    name: "Select headline",
    exact: true,
  });
  await headline.click();
  const editor = page.getByRole("textbox", { name: "Selected text" });
  await editor.fill("A headline edited in Chromium");
  await page.getByRole("button", { name: "Apply text" }).click();
  if (
    !(await page
      .locator(".lipat-canvas")
      .textContent()
      .then((t) => t.replace(/\s/g, "").includes("AheadlineeditedinChromium")))
  )
    throw new Error(
      "Text edit did not render: " +
        (await page.locator(".lipat-canvas").textContent()),
    );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  if (
    !(await page
      .locator(".lipat-canvas")
      .textContent()
      .then((t) => t.includes("Less positioning.")))
  )
    throw new Error("Undo did not restore text");
  // One pointer gesture must create one reversible move.
  const before = await headline.boundingBox();
  if (!before) throw new Error("Headline bounds missing");
  await page.mouse.move(
    before.x + before.width / 2,
    before.y + before.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    before.x + before.width / 2 + 25,
    before.y + before.height / 2 + 12,
    { steps: 8 },
  );
  await page.mouse.up();
  const after = await headline.boundingBox();
  if (!after || Math.abs(after.x - before.x - 25) > 2)
    throw new Error("Drag did not commit the expected position");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  const restored = await headline.boundingBox();
  if (!restored || Math.abs(restored.x - before.x) > 1)
    throw new Error("Drag undo was not atomic");
  await headline.click();
  const resize = page.getByRole("button", {
    name: "Resize headline",
    exact: true,
  });
  const handle = await resize.boundingBox();
  if (!handle) throw new Error("Resize handle missing");
  await page.mouse.move(
    handle.x + handle.width / 2,
    handle.y + handle.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handle.x + handle.width / 2 - 30,
    handle.y + handle.height / 2 + 15,
    { steps: 6 },
  );
  await page.mouse.up();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Agent headline" })
    .fill("An agent made this edit");
  await page.getByRole("button", { name: "Apply agent edit →" }).click();
  if (
    !(await page
      .locator(".lipat-canvas")
      .textContent()
      .then((t) => t.replace(/\s/g, "").includes("Anagentmadethisedit")))
  )
    throw new Error("Agent tool edit failed");
  await page
    .locator(".lipat-preview")
    .getByRole("button", { name: "Next", exact: true })
    .click();
  if (
    (await page.locator('.lipat-tabs [aria-current="page"]').textContent()) !==
    "1. Meet Lipat"
  )
    throw new Error("Preview navigation changed editor state");
  await page.getByRole("button", { name: "Present", exact: true }).click();
  await page.locator(".lipat-player svg").waitFor();
  await page
    .locator(".lipat-player")
    .getByRole("button", { name: "Next" })
    .click();
  const caption = page.locator(
    '.lipat-player [data-playback-id="workflow-caption"]',
  );
  if (
    await caption.evaluate(
      (element) => getComputedStyle(element).visibility !== "hidden",
    )
  )
    throw new Error("Fragment was visible before its step");
  await page
    .locator(".lipat-player")
    .getByRole("button", { name: "Next" })
    .click();
  if (
    await caption.evaluate(
      (element) => getComputedStyle(element).visibility !== "visible",
    )
  )
    throw new Error("Fragment did not become visible");
  // Motion must have an actual in-flight entrance, not merely toggle visibility.
  if (
    await caption.evaluate(
      (element) => Number(getComputedStyle(element).opacity) >= 1,
    )
  )
    throw new Error("Motion entrance did not start");
  await page.waitForFunction(() => {
    const element = document.querySelector(
      '.lipat-player [data-playback-id="workflow-caption"]',
    );
    return element && Number(getComputedStyle(element).opacity) === 1;
  });
  const player = page.locator(".lipat-player");
  await player.getByRole("button", { name: "Previous" }).click();
  if (
    await caption.evaluate(
      (element) => getComputedStyle(element).visibility !== "hidden",
    )
  )
    throw new Error("Backward navigation did not hide the animated fragment");
  await player.getByRole("button", { name: "Next" }).click();
  await player.getByRole("button", { name: "Previous" }).click();
  await player.getByRole("button", { name: "Next" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => {
    const element = document.querySelector(
      '.lipat-player [data-playback-id="workflow-caption"]',
    );
    return (
      element &&
      getComputedStyle(element).transform === "none" &&
      Number(getComputedStyle(element).opacity) === 1
    );
  });
  await player.getByRole("button", { name: "Previous" }).click();
  await player.getByRole("button", { name: "Next" }).click();
  if (
    await caption.evaluate(
      (element) =>
        getComputedStyle(element).transform !== "none" ||
        Number(getComputedStyle(element).opacity) !== 1,
    )
  )
    throw new Error("Reduced motion did not reveal immediately");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Editor", exact: true }).click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PPTX ↗" }).click();
  const file = await downloaded;
  await file.saveAs("artifacts/browser-export.pptx");
  await page
    .getByLabel("Open presentation")
    .setInputFiles("artifacts/browser-export.pptx");
  await page.locator(".lipat-canvas [data-node-id]").first().waitFor();
  if (
    !(await page
      .locator(".lipat-canvas")
      .textContent()
      .then((t) => t.replace(/\s/g, "").includes("Anagentmadethisedit")))
  )
    throw new Error("Downloaded PPTX did not reimport");
  await page
    .getByLabel("Open presentation")
    .setInputFiles("tests/fixtures/python-pptx.pptx");
  await page.getByRole("button", { name: "1. Slide 1", exact: true }).waitFor();
  if (
    !(await page
      .locator(".lipat-canvas")
      .textContent()
      .then((t) => t.includes("Hello 世界 & Lipat")))
  )
    throw new Error("Independent PPTX upload failed");
  await page.getByRole("button", { name: "Reset sample", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/demo-mobile.png", fullPage: true });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  if (overflow) throw new Error("Mobile demo overflows the viewport");
  await page
    .getByRole("button", { name: "Animation sample", exact: true })
    .click();
  await page.locator('.lipat-player [data-node-id="motion-title"]').waitFor();
  const samplePlayer = page.locator(".lipat-player");
  for (const effect of ["fade", "rise", "slide", "zoom"]) {
    const target = samplePlayer.locator(
      `[data-playback-id="motion-${effect}"]`,
    );
    if (
      await target.evaluate(
        (element) => getComputedStyle(element).visibility !== "hidden",
      )
    )
      throw new Error("Animation sample revealed a future effect: " + effect);
    await samplePlayer
      .getByRole("button", { name: "Next", exact: true })
      .click();
    await page.waitForFunction((id) => {
      const element = document.querySelector(
        `.lipat-player [data-playback-id="motion-${id}"]`,
      );
      return (
        element &&
        getComputedStyle(element).visibility === "visible" &&
        Number(getComputedStyle(element).opacity) === 1
      );
    }, effect);
    await assertPlaybackGeometry(target, effect);
  }
  await page
    .getByRole("button", { name: "Animation sample", exact: true })
    .click();
  if (
    await samplePlayer
      .locator('[data-playback-id="motion-fade"]')
      .evaluate((element) => getComputedStyle(element).visibility !== "hidden")
  )
    throw new Error("Loading the animation sample did not reset playback");
  await page.goto("http://127.0.0.1:4178/?sample=animations");
  await page.locator('.lipat-player [data-node-id="motion-title"]').waitFor();
  await page.setViewportSize({ width: 1440, height: 1100 });
  for (let step = 0; step < 4; step++)
    await page
      .locator(".lipat-player")
      .getByRole("button", { name: "Next", exact: true })
      .click();
  await page.waitForFunction(() => {
    return ["fade", "rise", "slide", "zoom"].every((effect) => {
      const element = document.querySelector(
        `.lipat-player [data-playback-id="motion-${effect}"]`,
      );
      return (
        element &&
        getComputedStyle(element).visibility === "visible" &&
        Number(getComputedStyle(element).opacity) === 1
      );
    });
  });
  for (const effect of ["fade", "rise", "slide", "zoom"])
    await assertPlaybackGeometry(
      page.locator(`.lipat-player [data-playback-id="motion-${effect}"]`),
      effect,
    );
  await page
    .locator(".lipat-player")
    .getByRole("button", { name: "Previous", exact: true })
    .click();
  await page
    .locator(".lipat-player")
    .getByRole("button", { name: "Next", exact: true })
    .click();
  await page.waitForFunction(() => {
    const element = document.querySelector(
      '.lipat-player [data-playback-id="motion-zoom"]',
    );
    return (
      element &&
      getComputedStyle(element).visibility === "visible" &&
      Number(getComputedStyle(element).opacity) === 1
    );
  });
  await assertPlaybackGeometry(
    page.locator('.lipat-player [data-playback-id="motion-zoom"]'),
    "zoom replay",
  );
  await page.screenshot({
    path: "artifacts/animation-playground.png",
    fullPage: true,
  });
  // Author effects through the actual JSON UI and preserve static rotation on every entrance.
  await page.getByRole("button", { name: "Document", exact: true }).click();
  await page.getByRole("textbox", { name: "Deck document" }).fill(
    JSON.stringify({
      id: "motion-check",
      slides: [
        {
          id: "effects",
          content: {
            id: "effects-canvas",
            type: "canvas",
            children: ["fade", "rise", "slide", "zoom"].map(
              (effect, index) => ({
                id: effect,
                type: "shape",
                fill: "#5B5BD6",
                step: 1,
                frame: {
                  x: 50 + index * 180,
                  y: 60,
                  width: 100,
                  height: 90,
                  rotation: 27,
                },
                animation: { effect, durationMs: 250, delayMs: 80 },
              }),
            ),
          },
        },
      ],
    }),
  );
  await page
    .getByRole("button", { name: "Apply document", exact: true })
    .click();
  await page.getByRole("button", { name: "Present", exact: true }).click();
  const rotations = await page
    .locator(".lipat-player [data-node-id]")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("transform")),
    );
  await page
    .locator(".lipat-player")
    .getByRole("button", { name: "Next" })
    .click();
  const zoom = page.locator('.lipat-player [data-playback-id="zoom"]');
  if (
    await zoom.evaluate(
      (element) => getComputedStyle(element).transform === "none",
    )
  )
    throw new Error("Zoom entrance did not transform its inner SVG group");
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".lipat-player [data-playback-id]")].every(
      (element) => Number(getComputedStyle(element).opacity) === 1,
    ),
  );
  const finalRotations = await page
    .locator(".lipat-player [data-node-id]")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("transform")),
    );
  if (
    JSON.stringify(rotations) !== JSON.stringify(finalRotations) ||
    !rotations.every((value) => value.startsWith("rotate(27 "))
  )
    throw new Error("Motion changed authored SVG rotation");
  if (errors.length) throw new Error(errors.join("\n"));
  // Browser preview loads a direct image URL; downloads resolve it into an offline asset.
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("http://127.0.0.1:4178/?sample=images");
  const remote = page.locator(
    '.lipat-player [data-playback-id="remote-image"]',
  );
  await remote.waitFor({ state: "attached" });
  const href = await remote.locator("image").getAttribute("href");
  if (href !== "http://127.0.0.1:4178/images/fold.png")
    throw new Error("Image URL sample source was not retained");
  await page
    .locator(".lipat-player")
    .getByRole("button", { name: "Next", exact: true })
    .click();
  await assertPlaybackGeometry(remote, "image zoom");
  await page.screenshot({
    path: "artifacts/image-url-playground.png",
    fullPage: true,
  });
  const imageDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PPTX ↗" }).click();
  await (await imageDownload).saveAs("artifacts/browser-image-url.pptx");
  const htmlDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download HTML", exact: true })
    .click();
  await (await htmlDownload).saveAs("artifacts/browser-image-url.html");
  const html = readFileSync("artifacts/browser-image-url.html", "utf8");
  if (
    !html.includes("data:image/png;base64,") ||
    html.includes("/images/fold.png")
  )
    throw new Error("URL image HTML download was not embedded");
  await page
    .getByLabel("Open presentation")
    .setInputFiles("artifacts/browser-image-url.pptx");
  await page.getByRole("button", { name: "Document", exact: true }).click();
  const imageDocument = JSON.parse(
    await page.getByLabel("Deck document").inputValue(),
  );
  if (
    imageDocument.assets.length !== 1 ||
    !JSON.stringify(imageDocument).includes('"effect":"zoom"')
  )
    throw new Error(
      "PPTX image bytes or native entrance were lost on browser reimport",
    );
  if (JSON.stringify(imageDocument).includes("/images/fold.png"))
    throw new Error("Offline PPTX retained an external image source");

  // CORS failures remain visible Result errors and never rewrite the deck's URL source.
  await new Promise((resolve) => imageServer.listen(0, "127.0.0.1", resolve));
  const imageAddress = imageServer.address();
  if (!imageAddress || typeof imageAddress === "string")
    throw new Error("Image fixture server did not start");
  const blockedImageUrl = `http://127.0.0.1:${imageAddress.port}/no-cors.png`;
  await page.getByLabel("Image URL", { exact: true }).fill(blockedImageUrl);
  await page
    .getByRole("button", { name: "Try image URL →", exact: true })
    .click();
  await page.getByRole("button", { name: "Export PPTX ↗" }).click();
  await page.getByRole("alert").filter({ hasText: "CORS" }).waitFor();
  await page.getByRole("button", { name: "Document", exact: true }).click();
  const failedDocument = JSON.parse(
    await page.getByLabel("Deck document").inputValue(),
  );
  if (
    failedDocument.assets.length !== 0 ||
    !JSON.stringify(failedDocument).includes(blockedImageUrl)
  )
    throw new Error("Failed image export mutated source");
  await page
    .getByLabel("Image URL", { exact: true })
    .fill("javascript:alert(1)");
  await page
    .getByRole("button", { name: "Try image URL →", exact: true })
    .click();
  await page.getByRole("alert").filter({ hasText: "HTTP(S)" }).waitFor();
  await page.getByRole("button", { name: "Reset sample", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  if (
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    )
  )
    throw new Error("Image URL controls overflow on mobile");

  docsServer = spawn(
    process.execPath,
    [
      fileURLToPath(
        new URL("../node_modules/vitepress/bin/vitepress.js", import.meta.url),
      ),
      "preview",
      "docs",
      "--host",
      "127.0.0.1",
      "--port",
      "4179",
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let docsLogs = "";
  docsServer.stdout.on("data", (chunk) => {
    docsLogs += chunk.toString();
  });
  docsServer.stderr.on("data", (chunk) => {
    docsLogs += chunk.toString();
  });
  let docsReady = false;
  for (let i = 0; i < 100; i++) {
    try {
      const response = await fetch("http://127.0.0.1:4179");
      if (response.ok) {
        docsReady = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!docsReady)
    throw new Error(
      "Documentation preview server did not become ready: " + docsLogs,
    );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://127.0.0.1:4179/playground.html");
  await page
    .frameLocator('iframe[title="Lipat slide authoring playground"]')
    .locator(".lipat-canvas svg")
    .waitFor();
  for (const path of [
    "/llms.txt",
    "/llms-full.txt",
    "/schemas.json",
    "/manifest.json",
    "/types/index.d.ts",
  ]) {
    const response = await fetch("http://127.0.0.1:4179" + path);
    if (!response.ok)
      throw new Error("Missing agent documentation output: " + path);
  }
  await page.screenshot({
    path: "artifacts/docs-playground.png",
    fullPage: true,
  });
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "Chromium verified WASM editing, history, previews, Motion entrances, interruption/reduced motion, SVG rotation, direct URL images, offline embedding, CORS errors, native PPTX animation import/export, documentation and mobile layout.",
  );
} finally {
  await browser?.close();
  imageServer.closeAllConnections();
  await new Promise((resolve) => imageServer.close(() => resolve()));
  await Promise.all([stopServer(server), stopServer(docsServer)]);
}

async function stopServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(() => child.kill("SIGKILL"), 5000);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill("SIGTERM");
  });
}

async function assertPlaybackGeometry(target, effect) {
  await target.evaluate(async (element) => {
    await Promise.all(
      element.getAnimations().map((animation) => animation.finished),
    );
  });
  const geometry = await target.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const transform = getComputedStyle(element).transform;
    const matrix =
      transform === "none"
        ? new DOMMatrixReadOnly()
        : new DOMMatrixReadOnly(transform);
    // Allow browser float serialization noise while rejecting scale loss or displacement.
    const atRest =
      matrix.is2D &&
      [
        matrix.a - 1,
        matrix.b,
        matrix.c,
        matrix.d - 1,
        matrix.e,
        matrix.f,
      ].every((value) => Math.abs(value) < 0.0001);
    return {
      width: bounds.width,
      height: bounds.height,
      transform,
      atRest,
    };
  });
  if (geometry.width < 1 || geometry.height < 1 || !geometry.atRest)
    throw new Error(
      `Animation ${effect} did not retain its final geometry: ${JSON.stringify(geometry)}`,
    );
}
