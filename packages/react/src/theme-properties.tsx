import { useState } from "react";
import type { ReactNode } from "react";
import type { LipatError } from "@lipat-internal/model";
import { useDeck, useDeckState } from "./deck-context";
/** Custom theme controls commit all document defaults together, leaving transient drafts out of history. */
export function ThemeProperties({
  onError,
}: {
  readonly onError: (error: LipatError) => void;
}): ReactNode {
  const deck = useDeck(),
    state = useDeckState(),
    [theme, setTheme] = useState(state.document.theme);
  const [title, setTitle] = useState(state.document.title),
    [size, setSize] = useState(state.document.size);
  return (
    <details className="lipat-custom-theme">
      <summary>Custom theme</summary>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const result = deck.apply([
            { type: "updateDocument", title, size },
            { type: "setTheme", theme },
          ]);
          if (!result.ok) onError(result.error);
        }}
      >
        <label>
          Presentation title
          <input
            aria-label="Presentation title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        {(["width", "height"] as const).map((key) => (
          <label key={key}>
            Slide {key}
            <input
              aria-label={`Slide ${key}`}
              type="number"
              min={1}
              value={size[key]}
              onChange={(event) =>
                setSize({ ...size, [key]: Number(event.target.value) })
              }
            />
          </label>
        ))}
        <label>
          Theme font family
          <input
            value={theme.fontFamily}
            onChange={(event) =>
              setTheme({ ...theme, fontFamily: event.target.value })
            }
          />
        </label>
        {(["fontSize", "headingSize", "padding", "gap"] as const).map((key) => (
          <label key={key}>
            {key}
            <input
              aria-label={`Theme ${key}`}
              type="number"
              value={theme[key]}
              onChange={(event) =>
                setTheme({ ...theme, [key]: Number(event.target.value) })
              }
            />
          </label>
        ))}
        {(["foreground", "background", "accent"] as const).map((key) => (
          <label key={key}>
            {key}
            <input
              aria-label={`Theme ${key}`}
              type="color"
              value={theme[key]}
              onChange={(event) =>
                setTheme({ ...theme, [key]: event.target.value })
              }
            />
          </label>
        ))}
        <button type="submit">Apply theme</button>
      </form>
    </details>
  );
}
