import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import type { DeckRuntime, DeckState } from "@lipat-internal/core";
import type { CompileOutput, LipatResult } from "@lipat-internal/model";
const DeckContext = createContext<{
  deck: DeckRuntime;
  readOnly: boolean;
} | null>(null);
/** Providers do not own or dispose their runtime. */
export function DeckProvider({
  deck,
  readOnly = false,
  children,
}: {
  readonly deck: DeckRuntime;
  readonly readOnly?: boolean;
  readonly children: ReactNode;
}): ReactNode {
  const value = useMemo(() => ({ deck, readOnly }), [deck, readOnly]);
  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
}
/** Use the nearest explicitly supplied editing runtime. */
export function useDeck(): DeckRuntime {
  const context = useContext(DeckContext);
  if (!context) throw new Error("Lipat DeckProvider is missing");
  return context.deck;
}
/** Read-only controls are a UI capability, not a document property. */
export function useDeckReadOnly(): boolean {
  const context = useContext(DeckContext);
  if (!context) throw new Error("Lipat DeckProvider is missing");
  return context.readOnly;
}
/** Subscribe through React's concurrent-safe external store API. */
export function useDeckState(): DeckState {
  const deck = useDeck();
  return useSyncExternalStore(deck.subscribe, deck.getState, deck.getState);
}
/** Compilation depends on document edits rather than navigation or selection. */
export function useDeckScene(): LipatResult<CompileOutput> {
  const deck = useDeck();
  const { document } = useDeckState();
  return useMemo(() => deck.compile(), [deck, document]);
}
