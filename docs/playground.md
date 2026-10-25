<script setup>
import {withBase} from 'vitepress';
</script>

# Playground

Create, edit, import and export with the real browser WebAssembly engine. Files stay in your browser; the playground does not upload them to a service.

Choose **Animation sample** to compare fade, rise, slide and zoom entrances. Press **Next** or the right arrow for each reveal; use **Previous** and advance again to replay. **Document** shows the editable animation JSON. Effects respect your device's reduced-motion setting.

PPTX downloads retain the supported native animations. Choose **Image sample**, or enter a direct **Image URL** and choose **Try image URL**. PPTX and HTML downloads embed URL images; the image server must allow browser fetches.

[Open the image sample directly](./playground/index.html?sample=images) · [Image API](./images.md)

[Open the animation sample directly](./playground/index.html?sample=animations) · [Animation API and output support](./animations.md)

<iframe :src="withBase('/playground/index.html')" title="Lipat slide authoring playground" style="width:100%;height:820px;border:1px solid var(--vp-c-divider);border-radius:10px" />

[Open the playground in its own window](./playground/index.html).
