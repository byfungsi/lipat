# Agent authoring

Use semantic source for creation. Prefer small operations by stable IDs over rewriting the complete document or generating coordinates for every element.

```ts
const tools = createAgentTools(deck, { engine });
// Pass tools.tools to your agent framework and route calls to tools.execute.
const outline = tools.execute("lipat_inspect", {});
const edited = tools.execute("lipat_apply", {
  expectedRevision: 0,
  operations: [
    { type: "updateText", nodeId: "intro-title", text: "A clearer headline" },
  ],
});
const layout = tools.execute("lipat_compile", {});
const preview = tools.execute("lipat_preview", { slideId: "intro" });
const output = tools.execute("lipat_export", { format: "pptx" });
```

`createAgentTools` does not call a model or start an MCP server. Its descriptions, input schemas and execution callbacks are provider-neutral. Adapt them to your preferred tool framework. `deckSchemas.document` is suitable for structured document generation; `deckSchemas.operation` describes atomic edits. Schemas are generated from native serde types, rather than separately handwritten tool contracts.

The intended loop:

1. Inspect the current revision and relevant slide/node IDs.
2. Apply one small atomic batch using `expectedRevision`.
3. On `revisionConflict`, inspect again before retrying.
4. Compile and inspect diagnostics by node ID.
5. Preview the affected slide and revise content, theme or layout.
6. Export only after reviewing the supported target and diagnostics.

Preview returns SVG text. A host can rasterize it for a vision model; Lipat does not silently assume a model accepts SVG. Compile returns a scene plus diagnostics. Export returns JSON source, HTML text or PPTX base64, with diagnostics alongside output. Tool calls return values; file access and delivery belong to the host.

For imported PPTX, parse separately and explicitly convert the scene to canvas source. Replace the relevant subtree with semantic layout when you want reflow. Imported positioning does not imply an inferred semantic component.
