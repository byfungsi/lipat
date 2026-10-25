import { useState } from "react";
import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { encodeAssetBytes } from "@byfungsi/lipat/model";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { createNativeLipat } from "@byfungsi/lipat-native";
import { createDeck } from "@byfungsi/lipat";
import {
  NativeDeckEditor,
  NativeScenePlayer,
  NativeScenePreview,
} from "@byfungsi/lipat/react-native";
import type { LipatResult } from "@byfungsi/lipat/model";
import { sampleDeck } from "../../react-demo/src/sample-deck";
function unwrap<T>(result: LipatResult<T>): T {
  if (!result.ok)
    throw Error(`${result.error.reason}: ${result.error.message}`);
  return result.value;
}
function initialize() {
  const engine = unwrap(
    createNativeLipat({
      limits: {
        maxSlides: 100,
        maxNodes: 5000,
        maxSceneElements: 5000,
        maxLayoutWork: 2000000,
      },
    }),
  );
  const deck = unwrap(createDeck(sampleDeck, { engine }));
  const scene = unwrap(deck.compile()).scene,
    output = unwrap(engine.writePptx(scene)),
    parsed = unwrap(engine.parsePptx(output.bytes));
  if (parsed.scene.slides.length !== scene.slides.length)
    throw Error("Native PPTX round trip failed");
  return {
    deck,
    engine,
    status: `Native Rust verified · ${scene.slides.length} slides · PPTX ${output.bytes.length} bytes`,
  };
}
export default function NativeApp() {
  const [initialized] = useState(() => {
      try {
        return { ok: true as const, value: initialize() };
      } catch (error) {
        return {
          ok: false as const,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    }),
    [mode, setMode] = useState<"edit" | "preview" | "present">("edit"),
    [saved, setSaved] = useState("");
  if (!initialized.ok)
    return (
      <SafeAreaView>
        <Text accessibilityRole="alert">{initialized.message}</Text>
      </SafeAreaView>
    );
  const { deck, status } = initialized.value,
    compiled = deck.compile();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={{ padding: 12, gap: 8 }}>
        <Text style={{ fontWeight: "600" }}>Lipat · Native presentations</Text>
        <Text accessibilityLabel="Native engine verification">{status}</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {(["edit", "preview", "present"] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={value}
              onPress={() => setMode(value)}
              style={{ padding: 10, borderWidth: 1, borderColor: "#D9DCE7" }}
            >
              <Text>{value}</Text>
            </Pressable>
          ))}
        </View>
        {saved ? (
          <Text accessibilityLabel="Saved presentation">{saved}</Text>
        ) : null}
      </View>
      {mode === "edit" ? (
        <NativeDeckEditor
          deck={deck}
          onSave={(document) => {
            const file = new File(Paths.document, "presentation.lipat.json");
            file.write(JSON.stringify(document));
            setSaved(
              `Host saved ${document.slides.length} slides · ${file.size} bytes`,
            );
          }}
          onPickImage={async () => {
            const picked = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
            });
            const image = picked.assets?.[0];
            return {
              ok: true,
              value: image
                ? {
                    kind: "uri",
                    uri: image.uri,
                    name: image.fileName ?? "Uploaded image",
                    ...(image.mimeType ? { mimeType: image.mimeType } : {}),
                  }
                : null,
            };
          }}
          resolveImage={async (input, context) => {
            if (input.kind === "url")
              return { ok: true, value: { url: input.url } };
            const bytes =
              input.kind === "bytes"
                ? input.bytes
                : await new File(input.uri).bytes();
            if (context.isCancelled())
              return {
                ok: false,
                error: { reason: "cancelled", message: "Image cancelled" },
              };
            const mime = input.mimeType ?? "image/png";
            if (
              mime !== "image/png" &&
              mime !== "image/jpeg" &&
              mime !== "image/gif" &&
              mime !== "image/webp"
            )
              return {
                ok: false,
                error: {
                  reason: "invalidImage",
                  message: "Unsupported image format",
                },
              };
            return {
              ok: true,
              value: {
                asset: {
                  id: `native-image-${deck.getState().revision}`,
                  mimeType: mime,
                  data: encodeAssetBytes(bytes),
                },
                alt: input.name,
              },
            };
          }}
        />
      ) : compiled.ok ? (
        mode === "preview" ? (
          <NativeScenePreview scene={compiled.value.scene} />
        ) : (
          <NativeScenePlayer scene={compiled.value.scene} />
        )
      ) : (
        <Text>{compiled.error.message}</Text>
      )}
    </SafeAreaView>
  );
}
