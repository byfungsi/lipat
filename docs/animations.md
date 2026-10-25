# Animations

Lipat keeps animation instructions in portable JSON. Two independent adapters translate them into [Motion](https://motion.dev/docs/animate) browser playback and native PowerPoint timing. Rust and WASM validate and export the same instructions; Motion itself runs only in browser JavaScript.

Native PPTX entrances and reveal steps are available in **0.3.0**. [Open the animation sample](./playground/index.html?sample=animations), or choose **Animation sample** in the playground. Advance four times to see fade, rise, slide and zoom; go backward and advance again to replay. Export the same deck as PPTX to retain its native builds. Choose **Document** to inspect or edit the JSON. Browser playback respects device reduced-motion preferences.

## Author an entrance

Add `animation` to a leaf node (text, heading, list, code, image, shape or table). `step` controls when it appears: omitted/zero means slide entry, integers 1–10000 mean subsequent reveal steps. Nodes at the same step enter together.

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
npm install @byfungsi/lipat@^0.3.0 motion@^14.6.0 react react-dom
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

## Native PowerPoint export

`engine.writePptx(scene)` translates the shared model into native PresentationML timing. It does not embed Motion or JavaScript. No Motion dependency is required to produce animated PPTX files, including from native Rust or WASM.

- Fade animates opacity; rise adds a 24-point vertical entrance; slide adds a 32-point horizontal entrance; zoom scales from 95% to 100%. Rotated targets retain their local entrance direction.
- Step zero starts automatically on slide entry. Positive steps consume clicks; targets at the same step start together with their own delays. Steps inherited from containers are resolved before export. A step without an effect becomes an appear build. Empty step gaps are written as timing placeholders and produce `emptyAnimationStep` diagnostics because some clients compact them; use consecutive steps for cross-client delivery.
- Durations and delays are rounded to whole milliseconds, with a minimum 1 ms duration; changed timings produce `animationTimingQuantized` diagnostics.
- `linear` maps directly. `easeOut` and `easeInOut` use native acceleration/deceleration approximations and produce `animationEasingApproximation` diagnostics. Browser and PowerPoint easing are not pixel-identical.
- Text, shapes, images and tables can be targets. At most 100000 reveal steps across a PPTX may be exported.

Lipat reparses its exported native subset into editable animation metadata and reveal steps. Import is deliberately conservative: unrelated motion paths, unsupported filters, repeated/interactive effects and other timing structures produce `unsupportedAnimation` diagnostics. This is not a general conversion of arbitrary PowerPoint animations into Motion.

The writer is checked with Microsoft's Open XML SDK validator and native/WASM equivalence and roundtrip tests. A manual Keynote import check confirms native entrance builds, durations, directions and sequential/parallel advancement. Keynote maps effects to its own presets and compacts empty steps. Desktop PowerPoint playback has not been verified in this environment. PowerPoint clients and other presentation apps may render timing differently; schema validity is not a guarantee of identical playback in every client.

## Output boundaries

| Output                         | Behavior                                                          |
| ------------------------------ | ----------------------------------------------------------------- |
| Lipat JSON / compiled scene    | Preserves portable animation instructions                         |
| Browser with Motion adapter    | Plays supported entrance effects                                  |
| Plain player / standalone HTML | Instant reveal steps; no entrance effects                         |
| SVG / editor / preview         | Static final state                                                |
| reveal.js adapter              | Reveal fragments; no Lipat entrance effects                       |
| PPTX export                    | Native entrances, click groups, automatic entry and delays        |
| PPTX import                    | Retains the recognized native subset; warns on unsupported timing |

Custom Motion springs, callbacks, arbitrary CSS/keyframes, exits, slide transitions and morphing are outside the portable contract. Use Lipat's `animation` fields for effects that must travel into PPTX.
