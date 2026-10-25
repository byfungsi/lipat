import { encodeAssetBytes, freezeDocument } from "@lipat-internal/model";
import type {
  DeckAsset,
  DeckDocument,
  DeckOperation,
  ElementFrame,
  LipatError,
  LipatResult,
  SlideNode,
} from "@lipat-internal/model";
import type { DeckRuntime } from "./deck-runtime";

/** Image input is supplied by a host picker, dropped file, URL field or arbitrary application command. */
export type EditorImageInput =
  | {
      readonly kind: "bytes";
      readonly bytes: Uint8Array;
      readonly mimeType: string;
      readonly name: string;
    }
  | {
      readonly kind: "uri";
      readonly uri: string;
      readonly mimeType?: string;
      readonly name: string;
    }
  | { readonly kind: "url"; readonly url: string; readonly name?: string };
/** A host image workflow returns only the final durable URL or embedded asset, never a temporary upload placeholder. */
export type EditorImageOutput =
  | { readonly url: string; readonly alt?: string }
  | { readonly asset: DeckAsset; readonly alt?: string };
/** Cancellation is portable across browser, React Native and headless hosts; the host owns network abort mechanics. */
export interface EditorTaskContext {
  readonly taskId: string;
  isCancelled(): boolean;
}
/** Persistence receives the exact immutable snapshot captured when Save was pressed. */
export type DeckSaveHandler = (
  document: DeckDocument,
  context: EditorTaskContext,
) => void | LipatResult<void> | Promise<void | LipatResult<void>>;
/** Upload to S3/R2, invoke a command or transform an image before returning its final source. No network client is built in. */
export type EditorImageResolver = (
  input: EditorImageInput,
  context: EditorTaskContext,
) => LipatResult<EditorImageOutput> | Promise<LipatResult<EditorImageOutput>>;
/** Pending work and recoverable errors are observable without subscribing to a UI framework. */
export type EditorTaskState =
  | { readonly status: "idle" }
  | { readonly status: "pending"; readonly taskId: string }
  | { readonly status: "error"; readonly error: LipatError };
/** Save state compares immutable document snapshots, so edits made during a save remain unsaved. */
export interface DeckEditorState {
  readonly dirty: boolean;
  readonly save: EditorTaskState;
  readonly image: EditorTaskState;
}
/** The session owns task lifetimes; the host retains ownership of its deck and persistence implementation. */
export interface DeckEditorOptions {
  readonly onSave?: DeckSaveHandler | undefined;
  readonly resolveImage?: EditorImageResolver | undefined;
  readonly readOnly?: boolean;
}
/** Shared editing workflows for web and native controls; each document mutation uses the runtime's atomic history. */
export interface DeckEditorSession {
  readonly deck: DeckRuntime;
  getState(): DeckEditorState;
  subscribe(listener: () => void): () => void;
  save(): Promise<LipatResult<void>>;
  addImage(
    input: EditorImageInput,
    options?: {
      readonly slideId?: string;
      readonly frame?: ElementFrame;
      readonly replaceNodeId?: string;
    },
  ): Promise<LipatResult<void>>;
  cancelImage(): void;
  insertNode(
    node: SlideNode,
    options?: { readonly slideId?: string; readonly parentId?: string },
  ): LipatResult<void>;
  createNodeId(kind: string): string;
  addSlide(): LipatResult<void>;
  duplicateSlide(slideId: string): LipatResult<void>;
  setSlideParent(slideId: string, parentId: string | null): LipatResult<void>;
  deleteSelection(): LipatResult<void>;
  duplicateSelection(): LipatResult<void>;
  moveLayer(
    direction: "front" | "back" | "forward" | "backward",
  ): LipatResult<void>;
  dispose(): void;
}
const success = (): LipatResult<void> => ({ ok: true, value: undefined });
const failure = (reason: string, message: string): LipatResult<never> => ({
  ok: false,
  error: { reason, message },
});

/** Construct an editor session without DOM, filesystem, network or ambient engine dependencies. */
export function createDeckEditorSession(
  deck: DeckRuntime,
  options: DeckEditorOptions = {},
): DeckEditorSession {
  return new EditorSession(deck, options);
}
class EditorSession implements DeckEditorSession {
  private saved: DeckDocument;
  private state: DeckEditorState = freezeDocument({
    dirty: false,
    save: { status: "idle" },
    image: { status: "idle" },
  });
  private readonly listeners = new Set<() => void>();
  private readonly unsubscribe: () => void;
  private disposed = false;
  private sequence = 0;
  private imageTask: { cancelled: boolean } | undefined;
  constructor(
    readonly deck: DeckRuntime,
    private readonly options: DeckEditorOptions,
  ) {
    this.saved = deck.exportDocument();
    this.unsubscribe = deck.subscribe(() =>
      this.update({
        ...this.state,
        dirty: this.saved !== deck.exportDocument(),
      }),
    );
  }
  getState = (): DeckEditorState => this.state;
  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(state: DeckEditorState) {
    if (this.disposed) return;
    if (
      state.dirty === this.state.dirty &&
      state.save === this.state.save &&
      state.image === this.state.image
    )
      return;
    this.state = freezeDocument(state);
    for (const listener of [...this.listeners]) listener();
  }
  private editable(): LipatResult<void> {
    return this.disposed
      ? failure("disposed", "Editor session has been disposed")
      : this.options.readOnly
        ? failure("readOnly", "Editor session is read-only")
        : success();
  }
  createNodeId(kind: string): string {
    const ids = new Set(
      this.deck
        .inspect()
        .slides.flatMap((slide) => [
          slide.id,
          ...slide.nodes.map((node) => node.id),
        ]),
    );
    const prefix = /^[a-zA-Z][a-zA-Z0-9-]{0,32}$/.test(kind) ? kind : "node";
    let id: string;
    do {
      id = `lipat-${prefix}-${++this.sequence}`;
    } while (ids.has(id));
    return id;
  }
  async save(): Promise<LipatResult<void>> {
    const check = this.editable();
    if (!check.ok) return check;
    if (!this.options.onSave)
      return failure(
        "saveUnavailable",
        "Editor save requires an onSave callback",
      );
    if (this.state.save.status === "pending")
      return failure("busy", "Editor save is already in progress");
    const document = this.deck.exportDocument();
    const taskId = `save-${++this.sequence}`;
    this.update({ ...this.state, save: { status: "pending", taskId } });
    let result: LipatResult<void>;
    try {
      result =
        (await this.options.onSave(document, {
          taskId,
          isCancelled: () => this.disposed,
        })) ?? success();
    } catch {
      result = failure(
        "saveFailed",
        "Editor save failed; retry or check the host persistence handler",
      );
    }
    if (this.disposed)
      return failure(
        "cancelled",
        "Editor save completed after the session was disposed",
      );
    if (result.ok) this.saved = document;
    this.update({
      ...this.state,
      dirty: this.saved !== this.deck.exportDocument(),
      save: result.ok
        ? { status: "idle" }
        : { status: "error", error: result.error },
    });
    return result;
  }
  insertNode(
    node: SlideNode,
    options: { readonly slideId?: string; readonly parentId?: string } = {},
  ): LipatResult<void> {
    if (options.parentId) {
      const check = this.editable();
      if (!check.ok) return check;
      const slideId = options.slideId ?? this.deck.getState().activeSlideId;
      const parent = this.deck
        .inspect({ slideId })
        .slides[0]?.nodes.find((item) => item.id === options.parentId);
      if (!parent)
        return failure(
          "staleTarget",
          "Editor target container no longer exists",
        );
      const siblings =
        this.deck
          .inspect({ slideId })
          .slides[0]?.nodes.filter((item) => item.parentId === parent.id) ?? [];
      const result = this.deck.apply([
        {
          type: "insertNode",
          parentId: parent.id,
          index: siblings.length,
          node,
        },
      ]);
      if (result.ok && this.deck.getState().activeSlideId === slideId)
        this.deck.setSelection([node.id]);
      return result;
    }
    return this.insertNodes(
      [node],
      options.slideId ?? this.deck.getState().activeSlideId,
      [],
    );
  }
  private insertNodes(
    nodes: readonly SlideNode[],
    slideId: string,
    before: readonly DeckOperation[],
  ): LipatResult<void> {
    const check = this.editable();
    if (!check.ok) return check;
    if (nodes.length === 0) return success();
    const slide = this.deck
      .exportDocument()
      .slides.find((item) => item.id === slideId);
    if (!slide)
      return failure("staleTarget", "Editor target slide no longer exists");
    const compiled = this.deck.compile();
    if (!compiled.ok) return compiled;
    const count =
      compiled.value.scene.slides.find((item) => item.id === slideId)?.elements
        .length ?? 0;
    const result = this.deck.applyToCanvas(slideId, [
      ...before,
      ...nodes.map((node, i): DeckOperation => ({
        type: "insertNode",
        parentId: slide.content.id,
        index: count + i,
        node,
      })),
    ]);
    if (result.ok && this.deck.getState().activeSlideId === slideId)
      this.deck.setSelection(nodes.map((node) => node.id));
    return result;
  }
  async addImage(
    input: EditorImageInput,
    options: {
      readonly slideId?: string;
      readonly frame?: ElementFrame;
      readonly replaceNodeId?: string;
    } = {},
  ): Promise<LipatResult<void>> {
    const check = this.editable();
    if (!check.ok) return check;
    if (this.state.image.status === "pending")
      return failure("busy", "Editor image workflow is already in progress");
    const slideId = options.slideId ?? this.deck.getState().activeSlideId;
    const task = { cancelled: false };
    this.imageTask = task;
    const taskId = `image-${++this.sequence}`;
    this.update({ ...this.state, image: { status: "pending", taskId } });
    const context = {
      taskId,
      isCancelled: () => task.cancelled || this.disposed,
    };
    let resolved: LipatResult<EditorImageOutput>;
    try {
      if (this.options.resolveImage)
        resolved = await this.options.resolveImage(input, context);
      else if (input.kind === "url")
        resolved = {
          ok: true,
          value: { url: input.url, ...(input.name ? { alt: input.name } : {}) },
        };
      else if (
        input.kind === "bytes" &&
        (input.mimeType === "image/png" ||
          input.mimeType === "image/jpeg" ||
          input.mimeType === "image/gif" ||
          input.mimeType === "image/webp")
      )
        resolved = {
          ok: true,
          value: {
            asset: {
              id: this.createNodeId("asset"),
              mimeType: input.mimeType,
              data: encodeAssetBytes(input.bytes),
            },
            alt: input.name,
          },
        };
      else if (input.kind === "bytes")
        resolved = failure(
          "invalidImage",
          "Editor images must be PNG, JPEG, GIF or WebP",
        );
      else
        resolved = failure(
          "imageResolverRequired",
          "Editor URI images require a host image resolver",
        );
    } catch {
      resolved = failure(
        "imageFailed",
        "Editor image workflow failed; retry or check the host image resolver",
      );
    }
    if (context.isCancelled())
      return failure("cancelled", "Editor image workflow was cancelled");
    let result: LipatResult<void>;
    if (!resolved.ok) result = resolved;
    else if (
      !this.deck.exportDocument().slides.some((slide) => slide.id === slideId)
    )
      result = failure("staleTarget", "Editor target slide no longer exists");
    else {
      const image = resolved.value;
      const source =
        "url" in image ? { url: image.url } : { assetId: image.asset.id };
      const assetOperations: DeckOperation[] =
        "asset" in image ? [{ type: "upsertAsset", asset: image.asset }] : [];
      if (options.replaceNodeId) {
        const target = this.deck
          .inspect({ slideId })
          .slides[0]?.nodes.find(
            (node) =>
              node.id === options.replaceNodeId && node.type === "image",
          );
        result = target
          ? this.deck.apply([
              ...assetOperations,
              { type: "setImageSource", nodeId: target.id, source },
            ])
          : failure("staleTarget", "Editor target image no longer exists");
      } else
        result = this.insertNodes(
          [
            {
              id: this.createNodeId("image"),
              type: "image",
              ...source,
              alt:
                image.alt ??
                (input.kind === "url" ? (input.name ?? "") : input.name),
              fit: "contain",
              frame: options.frame ?? { x: 48, y: 48, width: 320, height: 180 },
            },
          ],
          slideId,
          assetOperations,
        );
    }
    this.imageTask = undefined;
    this.update({
      ...this.state,
      image: result.ok
        ? { status: "idle" }
        : { status: "error", error: result.error },
    });
    return result;
  }
  cancelImage(): void {
    if (this.imageTask) this.imageTask.cancelled = true;
    this.imageTask = undefined;
    this.update({ ...this.state, image: { status: "idle" } });
  }
  addSlide(): LipatResult<void> {
    const check = this.editable();
    if (!check.ok) return check;
    const slideId = this.createNodeId("slide");
    const result = this.deck.apply([
      {
        type: "insertSlide",
        index: this.deck.exportDocument().slides.length,
        slide: {
          id: slideId,
          title: "New slide",
          content: {
            id: this.createNodeId("canvas"),
            type: "canvas",
            children: [],
          },
        },
      },
    ]);
    if (result.ok) this.deck.setActiveSlide(slideId);
    return result;
  }
  duplicateSlide(slideId: string): LipatResult<void> {
    const check = this.editable();
    if (!check.ok) return check;
    const slides = this.deck.exportDocument().slides;
    const index = slides.findIndex((slide) => slide.id === slideId),
      slide = slides[index];
    if (!slide)
      return failure(
        "invalidSelection",
        "Editor slide to duplicate does not exist",
      );
    const id = this.createNodeId("slide");
    const result = this.deck.apply([
      {
        type: "insertSlide",
        index: index + 1,
        slide: {
          ...slide,
          id,
          title: `${slide.title ?? "Slide"} copy`,
          content: this.copyNode(slide.content),
        },
      },
    ]);
    if (result.ok) this.deck.setActiveSlide(id);
    return result;
  }
  setSlideParent(slideId: string, parentId: string | null): LipatResult<void> {
    const check = this.editable();
    if (!check.ok) return check;
    const slides = this.deck.exportDocument().slides;
    const index = slides.findIndex((slide) => slide.id === slideId),
      slide = slides[index];
    if (!slide)
      return failure("invalidSelection", "Editor slide does not exist");
    const { parentId: _, ...topLevel } = slide;
    return this.deck.apply([
      { type: "deleteSlide", slideId },
      {
        type: "insertSlide",
        index,
        slide: parentId ? { ...topLevel, parentId } : topLevel,
      },
    ]);
  }
  private copyNode(node: SlideNode): SlideNode {
    return "children" in node
      ? {
          ...node,
          id: this.createNodeId(node.type),
          children: node.children.map((child) => this.copyNode(child)),
        }
      : { ...node, id: this.createNodeId(node.type) };
  }
  deleteSelection(): LipatResult<void> {
    const check = this.editable();
    if (!check.ok) return check;
    const { activeSlideId, selection } = this.deck.getState();
    const outline =
      this.deck.inspect({ slideId: activeSlideId }).slides[0]?.nodes ?? [];
    const selected = new Set(selection);
    const rootSelections = outline.filter(
      (node) =>
        selected.has(node.id) &&
        !this.hasSelectedAncestor(node.parentId, outline, selected),
    );
    if (!rootSelections.length) return success();
    const document = this.deck.exportDocument();
    const slideIndex = document.slides.findIndex(
      (slide) => slide.id === activeSlideId,
    );
    const slide = document.slides[slideIndex];
    if (!slide)
      return failure("invalidSelection", "Editor active slide does not exist");
    const removedRoots = new Set(rootSelections.map((node) => node.id));
    const removedAssets = new Set<string>(),
      retainedAssets = new Set<string>();
    const inspectAssets = (node: SlideNode, removed = false) => {
      removed = removed || removedRoots.has(node.id);
      if (node.type === "image" && node.assetId !== undefined)
        (removed ? removedAssets : retainedAssets).add(node.assetId);
      if ("children" in node)
        node.children.forEach((child) => inspectAssets(child, removed));
    };
    document.slides.forEach((item) => inspectAssets(item.content));
    const operations: DeckOperation[] = removedRoots.has(slide.content.id)
      ? [
          { type: "deleteSlide", slideId: slide.id },
          {
            type: "insertSlide",
            index: slideIndex,
            slide: {
              ...slide,
              content: {
                id: this.createNodeId("canvas"),
                type: "canvas",
                children: [],
              },
            },
          },
        ]
      : rootSelections.map((node) => ({ type: "deleteNode", nodeId: node.id }));
    for (const assetId of removedAssets)
      if (!retainedAssets.has(assetId))
        operations.push({ type: "deleteAsset", assetId });
    return this.deck.apply(operations);
  }
  private hasSelectedAncestor(
    parentId: string | null,
    nodes: ReturnType<DeckRuntime["inspect"]>["slides"][number]["nodes"],
    selected: Set<string>,
  ): boolean {
    while (parentId !== null) {
      if (selected.has(parentId)) return true;
      parentId = nodes.find((node) => node.id === parentId)?.parentId ?? null;
    }
    return false;
  }
  duplicateSelection(): LipatResult<void> {
    const check = this.editable();
    if (!check.ok) return check;
    const state = this.deck.getState(),
      slide = state.document.slides.find(
        (item) => item.id === state.activeSlideId,
      );
    if (!slide)
      return failure("invalidSelection", "Editor active slide does not exist");
    const compiled = this.deck.compile();
    if (!compiled.ok) return compiled;
    const elements =
      compiled.value.scene.slides.find((item) => item.id === slide.id)
        ?.elements ?? [];
    const selected = new Set(state.selection),
      copies: SlideNode[] = [];
    const visit = (node: SlideNode) => {
      if (selected.has(node.id)) {
        const copy = this.copyNode(node);
        const frame = copy.frame ??
          elements.find((element) => element.id === node.id)?.frame ?? {
            x: 0,
            y: 0,
            width: state.document.size.width,
            height: state.document.size.height,
          };
        copies.push({
          ...copy,
          frame: { ...frame, x: frame.x + 16, y: frame.y + 16 },
        });
      } else if ("children" in node) node.children.forEach(visit);
    };
    visit(slide.content);
    return this.insertNodes(copies, slide.id, []);
  }
  moveLayer(
    direction: "front" | "back" | "forward" | "backward",
  ): LipatResult<void> {
    const check = this.editable();
    if (!check.ok) return check;
    const state = this.deck.getState(),
      slide = state.document.slides.find(
        (item) => item.id === state.activeSlideId,
      );
    if (!slide)
      return failure("invalidSelection", "Editor active slide does not exist");
    const outline =
      this.deck.inspect({ slideId: slide.id }).slides[0]?.nodes ?? [];
    const compiled = this.deck.compile();
    if (!compiled.ok) return compiled;
    const elements =
      compiled.value.scene.slides.find((item) => item.id === slide.id)
        ?.elements ?? [];
    const id = state.selection[0],
      index = elements.findIndex((item) => item.id === id);
    if (!id || index < 0)
      return failure(
        "invalidSelection",
        "Editor layer requires a selected primitive",
      );
    // Existing canvas roots are retained; semantic roots are rewritten by applyToCanvas.
    const rootId = slide.content.id;
    const target =
      direction === "front"
        ? elements.length - 1
        : direction === "back"
          ? 0
          : direction === "forward"
            ? Math.min(elements.length - 1, index + 1)
            : Math.max(0, index - 1);
    if (target === index) return success();
    if (!outline.some((node) => node.id === id))
      return failure("invalidSelection", "Editor layer node does not exist");
    return this.deck.applyToCanvas(slide.id, [
      { type: "moveNode", nodeId: id, parentId: rootId, index: target },
    ]);
  }
  dispose(): void {
    this.disposed = true;
    if (this.imageTask) this.imageTask.cancelled = true;
    this.unsubscribe();
    this.listeners.clear();
  }
}
