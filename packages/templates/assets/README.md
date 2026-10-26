# Template photography

These fifteen original illustrative images were created with OpenAI's built-in image generator on 26 October 2026 for Lipat. They depict fictional scenes, products and people; they are not evidence of a real project, property, study or customer. This disclosure is also included in each deck's speaker notes.

The JPEGs are the source assets shipped in this repository. They were resized to a maximum dimension of 1280 pixels and JPEG-encoded for offline templates. Run `node scripts/generate-template-photography.mjs` after changing them to regenerate the typed, embedded asset module. The optional `/templates` entrypoint carries the photographs; the core SDK does not load them. No remote image requests, API key or image generation service is required at runtime.

## Prompt set

Common direction: landscape 16:9 premium editorial photography, tactile materials, deliberate composition, natural or studio lighting, realistic detail. No text, logos, watermarks or slide mockups.

| File                    | Subject and art direction                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| architecture-detail.jpg | Close view of a warm travertine bench, pale oak joinery, ivory linen and a handmade vase with olive branch; slim window shadows and Mediterranean afternoon light.                    |
| hospitality-detail.jpg  | Serene coastal guest room with low linen bed, cream plaster, rounded doorway to the blue sea, oak side table and ceramic cup; soft Mediterranean daylight.                            |
| culinary-detail.jpg     | Close candid view of an adult chef’s hands arranging carrots and herbs on an ivory plate; dark walnut counter, linen apron, olive oil and warm window light; no face.                 |
| architecture.jpg        | Warm limestone pavilion with a tall rectangular doorway, reflecting pool and olive tree; late afternoon Mediterranean light; rigorous low frontal composition, building on the right. |
| hospitality.jpg         | Quiet boutique coastal terrace, cream plaster, linen lounge, olive tree and deep blue sea; late afternoon sand, terracotta and azure; no faces.                                       |
| culinary.jpg            | Overhead-oblique ivory ceramic plate with roasted heirloom carrots, labneh, herb oil and seeds; dark walnut table, linen and fork; window chiaroscuro, plate right, quiet left.       |
| climate.jpg             | Aerial ancient temperate forest and winding glacial river; teal, turquoise and pale sandbanks; graphic diagonal in soft overcast light.                                               |
| community.jpg           | Three adults of varied ages and backgrounds at a candid creative workshop around a wooden table; hands, paper, plants and linen; warm sage, wood and cream, no posed handshakes.      |
| product.jpg             | Unbranded tapered cylindrical speaker in warm brushed metal and ivory acoustic mesh; charcoal stone plinth, coral backdrop, sculptural light and long shadow; subject right.          |
| research.jpg            | Clear laboratory flasks with blue and amber liquids on an ivory bench; natural window light and glass refractions; clean, plausible forms, no labels.                                 |
| creative.jpg            | Physical cobalt blue folded paper and a matte red sphere on a pale yellow plinth; real paper texture, crisp asymmetric geometry, objects right.                                       |
| city.jpg                | Upward view through a modern office canyon; glass, dark stone and soft amber last light; narrow pale sky, navy and warm silver, rigorous lines.                                       |
| textile.jpg             | Chalk white, rust red and olive woven fabrics draped over wooden forms; strong sunlight reveals weave and folds; minimal fashion art direction.                                       |
| logistics.jpg           | Near-top-down aerial container port; muted blue, red and cream grid beside teal water, gantry crane, late afternoon, no legible branding.                                             |
| technology.jpg          | Macro iridescent silicon wafer, blue/violet/copper diffraction and circuit pattern; low-key physical photography, wafer right and black negative space left.                          |

Design references are documented in [the redesign research](../../../docs/research/presentation-template-redesign.md). No third-party reference photographs or template files are included.
