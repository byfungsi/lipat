# PPTX import and export

`parsePptx(bytes,{engine})` accepts an unencrypted PPTX ZIP and returns a scene, diagnostics and source-part metadata. File access, network requests, text decoding and delivery are owned by the host. No external image/link target is fetched.

Supported content includes presentation relationships and slide order, standard text/rich runs, direct RGB/common scheme colors, basic geometry, raster images, simple table content, speaker notes, inherited placeholder geometry and inherited decorative shapes. Groups are flattened with warnings; complex transforms are approximate. The parser resolves paths relative to each source part and rejects package-root traversal, duplicate ZIP names, malformed XML and resource overages.

`engine.importScene(imported.scene)` returns an editable canvas document. This is a separate explicit step. The parser does not require authoring/layout and does not infer grids or semantic components.

`writePptx(scene,{engine})` writes a new canonical ZIP with a presentation, relationships, slides, blank layout/master/theme, embedded images and notes. It reports unsupported incremental-step export. Reopen exported bytes through the parser, or consume them in another application. Independent python-pptx verification checks writer interoperability.

## Resource limits

- Input ZIP: 32 MiB.
- Expanded package: 64 MiB; individual entries: 32 MiB.
- Package entries: 10,000; XML parts: 8 MiB and 200,000 XML nodes.
- DTD/entity expansion is disabled.
- Authoring documents: 10,000 slides, 100,000 nodes, 64 nested levels; requests: 96 MiB.
- Embedded raster asset bytes: 64 MiB total.

These are implementation bounds, not performance guarantees. Memory/runtime costs depend on content. Use workers for latency-sensitive hosts.

Successful parsing does not imply arbitrary-PowerPoint fidelity. Unsupported content is omitted or approximated with diagnostics for detected features. See the complete [support matrix](./support).
