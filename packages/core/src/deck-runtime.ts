import { freezeDocument, getNodeText } from "@lipat-internal/model";
import type {
  CompileOptions,
  CompileOutput,
  DeckDocument,
  DeckOperation,
  EntranceAnimation,
  LipatEngine,
  LipatResult,
  SlideNode,
} from "@lipat-internal/model";
/** Runtime state is immutable; selection and active slide are transient. */
export interface DeckState {
  readonly document: DeckDocument;
  readonly revision: number;
  readonly activeSlideId: string;
  readonly selection: readonly string[];
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}
/** Compact semantic outline avoids sending complete scenes back to an agent. */
export interface DeckOutline {
  readonly revision: number;
  readonly id: string;
  readonly title: string;
  readonly slides: readonly {
    readonly id: string;
    readonly title: string;
    readonly notes: string;
    readonly nodes: readonly {
      readonly id: string;
      readonly type: SlideNode["type"];
      readonly text: string;
      readonly parentId: string | null;
      readonly step?: number;
      readonly animation?: EntranceAnimation;
    }[];
  }[];
}
/** Headless editing store; hosts retain ownership of engine and subscription lifetimes. */
export interface DeckRuntime {
  /** Stable immutable snapshots support React useSyncExternalStore. */
  getState(): DeckState;
  /** Canonical JSON document; revalidate it when rehydrating. */
  exportDocument(): DeckDocument;
  /** Serial operations commit once or leave document, revision and history untouched. */
  apply(
    operations: readonly DeckOperation[],
    options?: { readonly expectedRevision?: number },
  ): LipatResult<void>;
  /** Compile without changing the document or navigation state. */
  compile(options?: CompileOptions): LipatResult<CompileOutput>;
  /** Return IDs and compact text; optionally restrict to one slide. */
  inspect(options?: {
    readonly slideId?: string;
    readonly maxTextLength?: number;
  }): DeckOutline;
  /** Set the active slide and clear the previous selection. */
  setActiveSlide(slideId: string): LipatResult<void>;
  /** Selected nodes must belong to the active slide. */
  setSelection(nodeIds: readonly string[]): LipatResult<void>;
  /** Undo one atomic transaction. */
  undo(): LipatResult<void>;
  /** Redo one transaction; a new edit clears redo. */
  redo(): LipatResult<void>;
  /** Listener cleanup is owned by the subscriber. */
  subscribe(listener: () => void): () => void;
  /** Release history and subscriptions; later mutations return disposed. */
  dispose(): void;
}
function flatten(
  node: SlideNode,
  parentId: string | null,
  output: DeckOutline["slides"][number]["nodes"][number][],
  max: number,
): void {
  output.push({
    id: node.id,
    type: node.type,
    text: "children" in node ? "" : getNodeText(node).slice(0, max),
    parentId,
    ...(node.step !== undefined ? { step: node.step } : {}),
    ...(node.animation !== undefined ? { animation: node.animation } : {}),
  });
  if ("children" in node)
    for (const child of node.children) flatten(child, node.id, output, max);
}
/** Validate serialized source through the portable core before creating an editable deck. */
export function createDeck(
  input: unknown,
  options: { readonly engine: LipatEngine; readonly historyLimit?: number },
): LipatResult<DeckRuntime> {
  const parsed = options.engine.parseDocument(input);
  if (!parsed.ok) return parsed;
  const first = parsed.value.slides[0];
  if (!first)
    return {
      ok: false,
      error: { reason: "invalidDocument", message: "A deck needs one slide" },
    };
  const limit = options.historyLimit ?? 100;
  if (!Number.isInteger(limit) || limit < 0 || limit > 10000)
    return {
      ok: false,
      error: {
        reason: "invalidInput",
        message: "History limit must be an integer from 0 to 10000",
      },
    };
  let state: DeckState = freezeDocument({
    document: parsed.value,
    revision: 0,
    activeSlideId: first.id,
    selection: [],
    canUndo: false,
    canRedo: false,
  });
  let disposed = false;
  const listeners = new Set<() => void>(),
    past: DeckDocument[] = [],
    future: DeckDocument[] = [];
  const alive = (): LipatResult<void> =>
    disposed
      ? {
          ok: false,
          error: { reason: "disposed", message: "Deck has been disposed" },
        }
      : { ok: true, value: undefined };
  const notify = () => {
    for (const listener of [...listeners]) listener();
  };
  const commit = (document: DeckDocument) => {
    const active =
      document.slides.find((s) => s.id === state.activeSlideId) ??
      document.slides[0];
    if (!active) throw new Error("Deck invariant failed: no active slide");
    const nodes: Parameters<typeof flatten>[2] = [];
    flatten(active.content, null, nodes, 0);
    state = freezeDocument({
      ...state,
      document,
      revision: state.revision + 1,
      activeSlideId: active.id,
      selection: state.selection.filter((id) => nodes.some((n) => n.id === id)),
      canUndo: past.length > 0,
      canRedo: future.length > 0,
    });
    notify();
  };
  return {
    ok: true,
    value: {
      getState: () => state,
      exportDocument: () => state.document,
      apply(operations, applyOptions = {}) {
        const check = alive();
        if (!check.ok) return check;
        if (
          applyOptions.expectedRevision !== undefined &&
          applyOptions.expectedRevision !== state.revision
        )
          return {
            ok: false,
            error: {
              reason: "revisionConflict",
              message: `Deck revision conflict: expected ${applyOptions.expectedRevision}, current ${state.revision}`,
            },
          };
        const next = options.engine.applyDocument(state.document, operations);
        if (!next.ok) return next;
        if (JSON.stringify(next.value) === JSON.stringify(state.document))
          return check;
        if (limit > 0) {
          past.push(state.document);
          if (past.length > limit) past.shift();
        }
        future.length = 0;
        commit(next.value);
        return check;
      },
      compile(compileOptions) {
        const check = alive();
        return check.ok
          ? options.engine.compile(state.document, compileOptions)
          : check;
      },
      inspect(inspectOptions = {}) {
        const max = Math.max(
          0,
          Math.min(10000, inspectOptions.maxTextLength ?? 160),
        );
        return {
          revision: state.revision,
          id: state.document.id,
          title: state.document.title,
          slides: state.document.slides
            .filter(
              (s) => !inspectOptions.slideId || s.id === inspectOptions.slideId,
            )
            .map((s) => {
              const nodes: Parameters<typeof flatten>[2] = [];
              flatten(s.content, null, nodes, max);
              return {
                id: s.id,
                title: s.title ?? "",
                notes: (s.notes ?? "").slice(0, max),
                nodes,
              };
            }),
        };
      },
      setActiveSlide(slideId) {
        const check = alive();
        if (!check.ok) return check;
        if (!state.document.slides.some((s) => s.id === slideId))
          return {
            ok: false,
            error: {
              reason: "invalidSelection",
              message: "Active slide does not exist",
            },
          };
        if (state.activeSlideId !== slideId) {
          state = freezeDocument({
            ...state,
            activeSlideId: slideId,
            selection: [],
          });
          notify();
        }
        return check;
      },
      setSelection(nodeIds) {
        const check = alive();
        if (!check.ok) return check;
        const active = state.document.slides.find(
          (s) => s.id === state.activeSlideId,
        );
        const nodes: Parameters<typeof flatten>[2] = [];
        if (active) flatten(active.content, null, nodes, 0);
        if (nodeIds.some((id) => !nodes.some((n) => n.id === id)))
          return {
            ok: false,
            error: {
              reason: "invalidSelection",
              message: "Selection must belong to the active slide",
            },
          };
        state = freezeDocument({ ...state, selection: [...new Set(nodeIds)] });
        notify();
        return check;
      },
      undo() {
        const check = alive();
        if (!check.ok) return check;
        const previous = past.pop();
        if (previous) {
          future.push(state.document);
          commit(previous);
        }
        return check;
      },
      redo() {
        const check = alive();
        if (!check.ok) return check;
        const next = future.pop();
        if (next) {
          past.push(state.document);
          commit(next);
        }
        return check;
      },
      subscribe(listener) {
        if (disposed) return () => {};
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      dispose() {
        disposed = true;
        listeners.clear();
        past.length = 0;
        future.length = 0;
      },
    },
  };
}
