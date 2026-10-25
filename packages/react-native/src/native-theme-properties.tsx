import { useState } from "react";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import type { DeckRuntime } from "@lipat-internal/core";
import type { LipatError } from "@lipat-internal/model";
import {
  nativeEditorStyles,
  NativeEditorButton,
  NativeEditorField,
} from "./native-editor-controls";
/** Native custom theme editing commits all default tokens in one undoable operation. */
export function NativeThemeProperties({
  deck,
  onError,
}: {
  readonly deck: DeckRuntime;
  readonly onError: (error: LipatError) => void;
}): ReactNode {
  const [theme, setTheme] = useState(deck.exportDocument().theme);
  const [title, setTitle] = useState(deck.exportDocument().title),
    [size, setSize] = useState(deck.exportDocument().size);
  return (
    <View style={nativeEditorStyles.panel}>
      <Text style={nativeEditorStyles.heading}>Custom theme</Text>
      <NativeEditorField
        label="Presentation title"
        value={title}
        onChange={setTitle}
      />
      {(["width", "height"] as const).map((key) => (
        <NativeEditorField
          key={key}
          label={`Slide ${key}`}
          value={String(size[key])}
          numeric
          onChange={(value) => setSize({ ...size, [key]: Number(value) })}
        />
      ))}
      <NativeEditorField
        label="Theme font family"
        value={theme.fontFamily}
        onChange={(value) => setTheme({ ...theme, fontFamily: value })}
      />
      {(["fontSize", "headingSize", "padding", "gap"] as const).map((key) => (
        <NativeEditorField
          key={key}
          label={`Theme ${key}`}
          value={String(theme[key])}
          numeric
          onChange={(value) => setTheme({ ...theme, [key]: Number(value) })}
        />
      ))}
      {(["foreground", "background", "accent"] as const).map((key) => (
        <NativeEditorField
          key={key}
          label={`Theme ${key}`}
          value={theme[key]}
          onChange={(value) => setTheme({ ...theme, [key]: value })}
        />
      ))}
      <NativeEditorButton
        label="Apply theme"
        onPress={() => {
          const result = deck.apply([
            { type: "updateDocument", title, size },
            { type: "setTheme", theme },
          ]);
          if (!result.ok) onError(result.error);
        }}
      />
    </View>
  );
}
