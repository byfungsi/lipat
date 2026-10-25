import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
/** Shared native editor controls use scoped platform styles, with no global theme mutation. */
export const nativeEditorStyles = StyleSheet.create({
  editor: { gap: 12, padding: 12, backgroundColor: "#F7F7FC" },
  bar: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  button: {
    padding: 9,
    borderWidth: 1,
    borderColor: "#D9DCE7",
    borderRadius: 7,
    borderCurve: "continuous",
    backgroundColor: "#FFFFFF",
  },
  selected: { borderColor: "#5B5BD6", backgroundColor: "#F0EEFF" },
  disabled: { opacity: 0.4 },
  field: { gap: 4, minWidth: 100 },
  input: {
    padding: 9,
    borderWidth: 1,
    borderColor: "#D9DCE7",
    borderRadius: 6,
    borderCurve: "continuous",
    backgroundColor: "#FFFFFF",
    color: "#172033",
  },
  panel: {
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E1E3EC",
    borderRadius: 9,
    borderCurve: "continuous",
    backgroundColor: "#FFFFFF",
  },
  heading: { fontWeight: "600", color: "#172033" },
  error: { color: "#A52929" },
  resize: {
    position: "absolute",
    right: -8,
    bottom: -8,
    width: 22,
    height: 22,
    backgroundColor: "#5B5BD6",
  },
  canvas: { width: "100%", overflow: "visible" },
});
/** Accessible native editing action; selection and disabled states are exposed to assistive technology. */
export function NativeEditorButton({
  label,
  onPress,
  disabled = false,
  selected = false,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly selected?: boolean;
}): ReactNode {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={[
        nativeEditorStyles.button,
        disabled ? nativeEditorStyles.disabled : null,
        selected ? nativeEditorStyles.selected : null,
      ]}
    >
      <Text>{label}</Text>
    </Pressable>
  );
}
/** Numeric drafts accept intermediate input without sending invalid numbers to document operations. */
export function NativeEditorField({
  label,
  value,
  onChange,
  multiline = false,
  numeric = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly multiline?: boolean;
  readonly numeric?: boolean;
}): ReactNode {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <View style={nativeEditorStyles.field}>
      <Text>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={numeric ? draft : value}
        onChangeText={(next) => {
          if (numeric) {
            setDraft(next);
            if (next.trim() !== "" && Number.isFinite(Number(next)))
              onChange(next);
          } else onChange(next);
        }}
        onEndEditing={() => {
          if (numeric) setDraft(value);
        }}
        multiline={multiline}
        keyboardType={numeric ? "numbers-and-punctuation" : "default"}
        style={nativeEditorStyles.input}
      />
    </View>
  );
}
