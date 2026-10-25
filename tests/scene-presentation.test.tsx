// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { ScenePlayer, ScenePreview } from "@byfungsi/lipat/react";
import { renderSlideSvg, renderDeckHtml } from "@byfungsi/lipat/render";
import { renderRevealMarkup } from "@byfungsi/lipat/reveal";
import { artifactScene } from "./scene-fixture";
afterEach(cleanup);
it("renders scene-only SSR previews without a runtime and omits external resources by default", () => {
  const html = renderToString(<ScenePreview scene={artifactScene} />);
  expect(html).toContain("Scene without WASM");
  expect(html).toContain("data:image/png;base64,");
  expect(html).not.toContain("tracker.invalid");
  expect(renderToString(<ScenePlayer scene={artifactScene} />)).toContain(
    "<svg",
  );
  expect(
    renderToString(
      <ScenePreview scene={artifactScene} imagePolicy="allow-external" />,
    ),
  ).toContain("https://tracker.invalid/remote.png");
});
it("applies embedded-only policy consistently to static SVG, HTML and reveal output", () => {
  const options = { imagePolicy: "embedded-only" as const };
  for (const markup of [
    renderSlideSvg(artifactScene, "one", options),
    renderDeckHtml(artifactScene, options),
    renderRevealMarkup(artifactScene, options),
  ]) {
    expect(markup).toContain("data:image/png;base64,");
    expect(markup).not.toContain("tracker.invalid");
  }
  const hostile = {
    ...artifactScene,
    assets: artifactScene.assets.map((a) => ({
      ...a,
      data: '\"/><image href="https://tracker.invalid/injection"/>',
    })),
  };
  expect(renderSlideSvg(hostile, "one", options)).not.toContain(
    "https://tracker.invalid",
  );
});
it("navigates immutable scenes, skips hidden slides in playback and resets on scene replacement", () => {
  const before = JSON.stringify(artifactScene);
  const view = render(<ScenePlayer scene={artifactScene} />);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(document.querySelector('[data-node-id="remote"]')).toBeTruthy();
  expect(document.querySelectorAll("image")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("2 / 2")).toBeTruthy();
  view.rerender(
    <ScenePlayer scene={{ ...artifactScene, title: "Another artifact" }} />,
  );
  expect(screen.getByText("1 / 2")).toBeTruthy();
  expect(document.querySelector('[data-node-id="remote"]')).toBeNull();
  expect(JSON.stringify(artifactScene)).toBe(before);
});
it("keeps preview navigation local and handles empty and hidden-only scenes", () => {
  const view = render(<ScenePreview scene={artifactScene} />);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("2 / 3")).toBeTruthy();
  view.rerender(<ScenePreview scene={{ ...artifactScene, slides: [] }} />);
  expect(screen.getByText("0 / 0")).toBeTruthy();
  expect(
    screen.getByRole<HTMLButtonElement>("button", { name: "Next" }).disabled,
  ).toBe(true);
  view.rerender(
    <ScenePlayer
      scene={{
        ...artifactScene,
        slides: artifactScene.slides.filter((s) => s.hidden),
      }}
    />,
  );
  expect(screen.getByText("No visible slides.")).toBeTruthy();
});
