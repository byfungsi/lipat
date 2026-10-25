export * from "./deck-runtime";
export { fromMarkdown } from "./markdown-authoring";
export {
  deckThemes,
  createTitleSlide,
  createComparisonSlide,
  createContentSlide,
} from "./slide-presets";
export { createDeckEditorSession } from "./deck-editor-session";
export type {
  DeckEditorSession,
  DeckEditorOptions,
  DeckEditorState,
  DeckSaveHandler,
  EditorImageInput,
  EditorImageOutput,
  EditorImageResolver,
  EditorTaskContext,
  EditorTaskState,
} from "./deck-editor-session";
export { createEditorNode, findSlideNode } from "./editor-content";
export type { EditorContentKind } from "./editor-content";
