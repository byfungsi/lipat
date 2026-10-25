import { build } from "esbuild";
import { chromium } from "playwright";
const bundled = await build({
  entryPoints: ["tests/browser-scene-entry.tsx"],
  bundle: true,
  platform: "browser",
  format: "esm",
  write: false,
  metafile: true,
  define: { "process.env.NODE_ENV": '"production"' },
});
const code = bundled.outputFiles[0]?.text;
if (
  !code ||
  code.includes("lipat_execute") ||
  code.includes("new WebAssembly.Module")
)
  throw new Error("Scene-only browser bundle pulled a WASM bridge");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const requests = [],
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().startsWith("https://tracker.invalid/"))
      requests.push(request.url());
  });
  await page.route("http://scene.test/**", (route) =>
    route.fulfill({
      contentType: route.request().url().endsWith("bundle.js")
        ? "text/javascript"
        : "text/html",
      body: route.request().url().endsWith("bundle.js")
        ? code
        : '<!doctype html><div id="root"></div><script type="module" src="/bundle.js"></script>',
    }),
  );
  await page.route("https://tracker.invalid/**", (route) => {
    return route.abort();
  });
  await page.goto("http://scene.test/");
  const player = page.locator(".lipat-player");
  await player.locator("svg").waitFor();
  const loaded = await page
    .locator("image")
    .first()
    .evaluate(async (node) => {
      const image = new Image();
      image.src = node.getAttribute("href") ?? "";
      await image.decode();
      return image.naturalWidth > 0;
    });
  if (!loaded) throw new Error("Embedded raster could not be decoded");
  if (await page.locator('image[href^="http"]').count())
    throw new Error("Strict scene rendering emitted a remote image");
  await player.getByRole("button", { name: "Next", exact: true }).click();
  await player.locator('[data-playback-id="remote"]').evaluate(async (node) => {
    await Promise.all(node.getAnimations().map((a) => a.finished));
  });
  await player.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .locator(".lipat-preview")
    .getByRole("button", { name: "Next", exact: true })
    .click();
  if (requests.length)
    throw new Error(
      "Embedded-only navigation fetched an external resource: " +
        requests.join(","),
    );
  await player.getByRole("button", { name: "Previous", exact: true }).click();
  const external = page.waitForRequest("https://tracker.invalid/remote.png");
  await page
    .getByRole("button", { name: "Toggle external images", exact: true })
    .click();
  await external;
  if (!requests.includes("https://tracker.invalid/remote.png"))
    throw new Error("Explicit external-image opt-in did not load the image");
  if (requests.some((url) => !url.endsWith("/remote.png")))
    throw new Error("A paint URL escaped rendering policy");
  await page
    .getByRole("button", { name: "Replace scene", exact: true })
    .click();
  await page.getByText("No visible slides.").waitFor();
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "Scene-only browser: no WASM bridge, embedded images render, strict previews/playback/navigation emit no external fetches; explicit image opt-in and replacement cleanup verified.",
  );
} finally {
  await browser.close();
}
