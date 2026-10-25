import type { ElementFrame, SlideNode } from "@lipat-internal/model";
/** Content palette excludes images, which must complete an explicit image source workflow first. */
export type EditorContentKind = Exclude<SlideNode["type"], "image">;
/** Initial content uses points and ordinary document nodes, so hosts can replace these defaults with their own templates. */
export function createEditorNode(
  kind: EditorContentKind,
  id: string,
  frame: ElementFrame = { x: 48, y: 48, width: 320, height: 160 },
): SlideNode {
  const base = { id, frame };
  switch (kind) {
    case "heading":
      return { ...base, type: kind, text: "New heading" };
    case "text":
      return { ...base, type: kind, text: "New text" };
    case "list":
      return { ...base, type: kind, items: ["First item", "Second item"] };
    case "code":
      return {
        ...base,
        type: kind,
        text: "// Your code here",
        language: "text",
      };
    case "shape":
      return {
        ...base,
        type: kind,
        geometry: "rect",
        fill: "#5B5BD6",
        stroke: null,
      };
    case "table":
      return {
        ...base,
        type: kind,
        columns: ["Column 1", "Column 2"],
        rows: [["Value 1", "Value 2"]],
      };
    case "grid":
      return { ...base, type: kind, columns: 2, gap: 16, children: [] };
    case "stack":
    case "row":
      return { ...base, type: kind, gap: 16, children: [] };
    case "canvas":
      return { ...base, type: kind, children: [] };
  }
}
/** Find a semantic node without assuming the source has already been flattened into a canvas. */
export function findSlideNode(
  node: SlideNode,
  id: string,
): SlideNode | undefined {
  if (node.id === id) return node;
  if ("children" in node)
    for (const child of node.children) {
      const found = findSlideNode(child, id);
      if (found) return found;
    }
  return undefined;
}
