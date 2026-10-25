import { useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { DeckRuntime } from "@lipat-internal/core";
import { ScenePreview, ScenePlayer } from "./scene-presentation";
import type { ScenePreviewProps, ScenePlayerProps } from "./scene-presentation";

function useCompiledDeck(deck: DeckRuntime) {
  const state = useSyncExternalStore(
    deck.subscribe,
    deck.getState,
    deck.getState,
  );
  return useMemo(() => deck.compile(), [deck, state.document]);
}
/** Runtime attachment preview retains external-image behavior; use imagePolicy to restrict resource loading. */
export function DeckPreview({
  deck,
  imagePolicy = "allow-external",
  ...options
}: Omit<ScenePreviewProps, "scene"> & {
  readonly deck: DeckRuntime;
}): ReactNode {
  const compiled = useCompiledDeck(deck);
  return compiled.ok ? (
    <ScenePreview
      scene={compiled.value.scene}
      imagePolicy={imagePolicy}
      {...options}
    />
  ) : (
    <p role="alert">{compiled.error.message}</p>
  );
}
/** Runtime player compiles on edits and delegates immutable rendering to ScenePlayer. */
export function DeckPlayer({
  deck,
  imagePolicy = "allow-external",
  ...options
}: Omit<ScenePlayerProps, "scene"> & {
  readonly deck: DeckRuntime;
}): ReactNode {
  const compiled = useCompiledDeck(deck);
  return compiled.ok ? (
    <ScenePlayer
      scene={compiled.value.scene}
      imagePolicy={imagePolicy}
      {...options}
    />
  ) : (
    <p role="alert">{compiled.error.message}</p>
  );
}
