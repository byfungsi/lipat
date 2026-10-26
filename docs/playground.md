<script setup>
import {withBase} from 'vitepress';
</script>

# Playground

Create, edit, import and export with the real browser WebAssembly engine. Files stay in your browser; the playground does not upload them to a service.

The built-in editor includes slide and content controls, palette/file drag and drop, movement/resizing, layers, rich-text and table properties, themes, notes, and animation timing. Select an element to edit its properties, then choose **Apply properties**. **Preview animations** and **Replay** show the current slide's reveal sequence. The playground's **Save** button downloads the document through the same host callback your app can use for its own storage. See [embedding the editor](./editor.md).

Choose **Animation sample** to compare fade, rise, slide and zoom entrances. Press **Next** or the right arrow for each reveal; use **Previous** and advance again to replay. **Document** shows the editable animation JSON. Effects respect your device's reduced-motion setting.

PPTX downloads retain the supported native animations. Choose **Image sample**, or enter a direct **Image URL** and choose **Try image URL**. PPTX and HTML downloads embed URL images; the image server must allow browser fetches.

[Open the image sample directly](./playground/index.html?sample=images) · [Image API](./images.md)

[Open the animation sample directly](./playground/index.html?sample=animations) · [Animation API and output support](./animations.md)

[Open the immutable scene-only viewer](./playground/scene.html) to preview or play a resolved scene without loading an editing engine or WASM.

<iframe :src="withBase('/playground/index.html')" title="Lipat slide authoring playground" style="width:100%;height:820px;border:1px solid var(--vp-c-divider);border-radius:10px" />

[Open the playground in its own window](./playground/index.html).

## Templates, charts and SVG (unreleased)

[Browse all 60 templates](./playground/index.html?sample=templates), preview all six slides, use a deck in the editor, or download its native PPTX. Filter by Students & learning, Research, Tech talks, Marketing & creative, Business, or Industry & impact, then search within the category. The [charts and SVG sample](./playground/index.html?sample=charts-svg) demonstrates all six chart kinds and original embedded vector artwork. Direct template links use `?template=product-horizon` (or another catalog ID).
