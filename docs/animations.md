# Animations

Lipat keeps animation instructions in JSON and plays them through an optional [Motion](https://motion.dev/docs/animate) browser adapter. Rust and WASM validate and preserve the same metadata. Motion executes in JavaScript in the browser.

Available in `@byfungsi/lipat` **0.2.0** and later. [Open the animation sample](./playground/index.html?sample=animations), or choose **Animation sample** in the playground. Advance four times to see fade, rise, slide and zoom; go backward and advance again to replay. Choose **Document** to inspect or edit the JSON. Device reduced-motion preferences reveal the content immediately.

## Author an entrance

Add `animation` to a leaf node (text, heading, list, code, image, shape or table). `step` controls when it appears: omitted/zero means slide entry, positive integers mean subsequent reveal steps. Nodes at the same step enter together.

```ts
const node = {
  id: "revenue",
  type: "heading",
  text: "Revenue grew 32%",
  step: 1,
  animation: {
    effect: "rise",
    durationMs: 400,
    delayMs: 60,
    easing: "easeOut",
  },
} as const;
```

Effects are `fade`, `rise` (24 points upward into position), `slide` (32 points from the left) and `zoom` (0.95 to full scale). Defaults: 350 ms duration, zero delay, `easeOut`. Duration accepts 0–10000 ms; delay accepts 0–60000 ms. Easing also accepts `easeInOut` and `linear`. Motion-specific callbacks, executable values and arbitrary CSS are rejected. Containers accept inherited reveal steps, but entrance effects currently require leaf nodes.

## Play with React

Install `motion` alongside React when using the optional `/motion` entrypoint:

```sh
npm install @byfungsi/lipat@^0.2.0 motion@^14.6.0 react react-dom
```

```tsx
import { DeckPlayer } from "@byfungsi/lipat/react";
import { createMotionPlayback } from "@byfungsi/lipat/motion";

// Keep the adapter stable across renders. One instance can serve multiple players.
const playback = createMotionPlayback();

function Presentation({ deck }) {
  return <DeckPlayer deck={deck} playback={playback} />;
}
```

The player animates newly revealed nodes, retains existing animations during step advances and hides future nodes immediately on backward navigation. Advancing again replays their entrances. Changing slides, changing the document or unmounting cancels owned animations and releases listeners. Static geometry/rotation is isolated from animation transforms. Playback never changes document history.

Reduced motion follows the OS preference, including live changes. It skips transforms, opacity animation and delays and reveals content immediately. `createMotionPlayback({reducedMotion: "always"})` forces this behavior; `"never"` opts out. The default is `"user"`.

`DeckPlayer` without `playback` still uses instantaneous reveal steps. `DeckPreview` and the editor remain static.

## Agent edits

Use the existing atomic apply tool or runtime operations:

```ts
deck.apply([
  { type: "setStep", nodeId: "revenue", step: 1 },
  {
    type: "setAnimation",
    nodeId: "revenue",
    animation: { effect: "rise", durationMs: 400 },
  },
]);
```

`setAnimation` with `animation: null` removes the effect; `setStep` with `step: null` removes the node's explicit step, restoring its inherited/default step. Both participate in revision checks, atomic validation and undo/redo. Native-generated agent schemas include both operations.

## Vanilla browser hosts

React is optional. Render the complete SVG, mount an adapter, then set the initial reveal step:

```ts
import { renderSlideSvg } from "@byfungsi/lipat/render";
import { createMotionPlayback } from "@byfungsi/lipat/motion";

surface.innerHTML = renderSlideSvg(scene, slide.id, {
  step: 0,
  retainSteps: true,
});
const controller = createMotionPlayback().mount(surface, slide);
controller.setStep(0);
// On next/previous: controller.setStep(step).
// Before replacing the SVG or removing the surface:
controller.destroy();
```

The generic `SlidePlaybackDriver<Surface>` contract belongs to the portable model. Motion implements it for `HTMLElement`; React handles mounting and navigation. Alternate playback engines can implement the same contract. Each controller scopes DOM access to its own surface. Importing the adapter does not access the DOM or start animation.

## Output boundaries

| Output                         | Behavior                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------- |
| Lipat JSON / compiled scene    | Preserves animation instructions                                                |
| Browser with Motion adapter    | Plays supported entrance effects                                                |
| Plain player / standalone HTML | Instant reveal steps; entrance effects are ignored                              |
| SVG / editor / preview         | Static final state                                                              |
| reveal.js adapter              | Reveal fragments; Lipat entrance effects are ignored                            |
| PPTX export                    | Static final state, with `unsupportedAnimationExport` diagnostics by node       |
| PPTX import                    | Native animation/timing remains unsupported and produces warnings when detected |

Motion does not translate effects into PowerPoint timing XML. Slide transitions, exits, arbitrary timelines, spring authoring and morphing between slides are future extensions to the portable contract.
