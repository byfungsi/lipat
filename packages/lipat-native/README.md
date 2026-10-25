# Lipat native engine

Optional Rust engine binary and Expo module for `@byfungsi/lipat`. Install this package in the native app alongside `@byfungsi/lipat`, React Native, `react-native-svg` and `expo-modules-core`. Rebuild the development or production native app. Expo Go does not include this custom native module.

```ts
import { createNativeLipat } from "@byfungsi/lipat-native";
import { createDeck } from "@byfungsi/lipat";
const initialized = createNativeLipat({
  limits: { maxSlides: 100, maxNodes: 5000 },
});
if (initialized.ok) {
  const deck = createDeck(
    {
      id: "mobile",
      slides: [
        {
          id: "s",
          content: { id: "title", type: "heading", text: "Native Lipat" },
        },
      ],
    },
    { engine: initialized.value },
  );
}
```

Use `NativeDeckEditor`, `NativeScenePreview` and `NativeScenePlayer` from `@byfungsi/lipat/react-native`. Scene-only views need no engine or native add-on. Editing supports host-controlled Save and asynchronous image resolution, including upload/processing before returning a final URL or embedded asset.

The native module performs no filesystem/network access and uses the same Rust validation, layout, editing, limits and PPTX crates as WASM. Calls are synchronous; configure resource limits and isolate large jobs appropriately.

The platform-independent `@byfungsi/lipat/native` adapter also accepts another trusted implementation of `LipatNativeBridge`. See [the React Native guide](https://byfungsi.github.io/lipat/react-native.html) for platform setup and verification details.
