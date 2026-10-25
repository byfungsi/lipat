import type { SlideScene } from "@byfungsi/lipat/model";
import { freezeDocument } from "@byfungsi/lipat/model";
/** An immutable presentation artifact: embedded raster data and positioned primitives, with no engine dependency. */
export const sceneSample: SlideScene = freezeDocument({
  version: 1,
  title: "A scene, ready to share.",
  size: { width: 960, height: 540 },
  assets: [
    {
      id: "paper",
      mimeType: "image/png",
      data: "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",
    },
  ],
  slides: [
    {
      id: "intro",
      title: "A scene, ready to share.",
      notes: "A resolved scene carries its own geometry and embedded image.",
      hidden: false,
      background: "#FFFFFF",
      elements: [
        {
          id: "headline",
          type: "text",
          text: "A scene, ready to share.",
          runs: [],
          lines: ["A scene, ready to share."],
          lineHeight: 52,
          style: { fontSize: 42, bold: true, color: "#172033" },
          frame: { x: 55, y: 60, width: 850, height: 80 },
        },
        {
          id: "description",
          type: "text",
          text: "Read-only slides. Local navigation. Images embedded for offline viewing.",
          runs: [],
          lines: [
            "Read-only slides.",
            "Local navigation.",
            "Images embedded",
            "for offline viewing.",
          ],
          lineHeight: 38,
          style: { fontSize: 26, color: "#5B6172" },
          frame: { x: 55, y: 185, width: 330, height: 240 },
        },
        {
          id: "paper-image",
          type: "image",
          assetId: "paper",
          alt: "Folded paper illustration",
          fit: "contain",
          style: {},
          frame: { x: 420, y: 175, width: 470, height: 310 },
          step: 1,
          animation: { effect: "zoom", durationMs: 450 },
        },
      ],
    },
    {
      id: "next",
      title: "Keep the scene. Change the host.",
      notes: "ScenePlayer supports the same optional Motion playback adapter.",
      hidden: false,
      background: "#F0EDFF",
      elements: [
        {
          id: "next-headline",
          type: "text",
          text: "Keep the scene.",
          runs: [],
          lines: ["Keep the scene."],
          lineHeight: 58,
          style: { fontSize: 50, bold: true, color: "#172033" },
          frame: { x: 60, y: 150, width: 800, height: 90 },
        },
        {
          id: "next-body",
          type: "text",
          text: "Change the host.",
          runs: [],
          lines: ["Change the host."],
          lineHeight: 58,
          style: { fontSize: 50, color: "#7063D9" },
          frame: { x: 60, y: 255, width: 800, height: 90 },
          step: 1,
          animation: { effect: "rise", durationMs: 400 },
        },
      ],
    },
  ],
});
