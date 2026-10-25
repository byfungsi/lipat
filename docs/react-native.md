# React Native

Lipat provides native scene views and an editor at `@byfungsi/lipat/react-native`. These use React Native controls and `react-native-svg`, with no DOM or WebView. The preview/player accept resolved `SlideScene` data and need no parsing/authoring engine.

```tsx
import {
  NativeScenePreview,
  NativeScenePlayer,
} from "@byfungsi/lipat/react-native";
<NativeScenePreview scene={scene} onOpen={openPresentation} />;
<NativeScenePlayer scene={scene} />;
```

Install `react-native-svg` in the native app itself and rebuild the app as required by your host. The entrypoint is isolated: browser, Node and Worker consumers do not install or import React Native. Native previews/players default to `embedded-only` raster images, just like scene-only browser views. Opt in with `imagePolicy="allow-external"` when the host allows linked images.

## Native engine

Hermes does not need browser WebAssembly support. The optional `@byfungsi/lipat-native` package supplies an Expo module backed by the same Rust dispatcher as WASM. It provides document validation, editing, deterministic layout, PPTX import/export and resource limits through a synchronous JSON bridge.

For an Expo development build, install the public packages in the app:

```sh
npm install @byfungsi/lipat @byfungsi/lipat-native
npx expo install react-native-svg
npx expo run:ios       # or: npx expo run:android
```

Then start Metro with `npx expo start --dev-client`. Rebuild the development app after adding or upgrading the native add-on. The published add-on includes the platform binaries; consumers do not need Rust or an NDK to install it.

Install the native add-on in the **app** alongside `@byfungsi/lipat`, React Native and `react-native-svg`. Expo applications use a development/production build; Expo Go does not contain this custom module. Bare React Native applications can install Expo Modules infrastructure and use the same bridge.

```ts
import { createNativeLipat } from "@byfungsi/lipat-native";
import { createDeck } from "@byfungsi/lipat";
const initialized = createNativeLipat({
  limits: {
    maxSlides: 100,
    maxNodes: 5000,
    maxSceneElements: 5000,
    maxLayoutWork: 2000000,
  },
});
if (!initialized.ok) return showError(initialized.error.message);
const created = createDeck(input, { engine: initialized.value });
```

The bridge performs no filesystem/network access and creates no implicit singleton. Hosts own file/picker/transport capabilities. `createLipatFromNative(bridge, options)` at `/native` also accepts another trusted `LipatNativeBridge` implementation; it checks the ABI and protocol before returning an engine. Calls are synchronous and block the JavaScript thread. Resource budgets are processing bounds, not interrupting timeouts.

The native platform ABI uses pointer-sized lengths and explicit owned response freeing. It does not use the WASM ABI's packed 32-bit pointers on a 64-bit device.

## Native editor

```tsx
import { NativeDeckEditor } from "@byfungsi/lipat/react-native";
<NativeDeckEditor
  deck={deck}
  onSave={(document) => presentations.save(document)}
  onPickImage={pickImage}
  resolveImage={uploadOrEmbedImage}
/>;
```

The editor shares the headless session's save/upload lifecycle, immutable snapshots, cancellation and atomic history with the web editor. It provides touch movement/resizing, slide/content/layer controls, text/table/image/shape formatting, frame/rotation, notes/themes and reveal/entrance settings. Preview/replay uses native transform/opacity animation and the OS reduced-motion preference.

`onPickImage` returns `Promise<LipatResult<EditorImageInput|null>>`. Return `null` after a cancelled picker. A typical Expo picker returns a URI; `resolveImage` can read it with the app's filesystem API, upload to S3/R2, run commands and return its final URL or an embedded asset. Nothing is inserted before resolution. The [editor guide](./editor.md) describes save and image contracts shared across platforms.

An application owning its session can pass `session`; dispose it at the end of that application's lifetime. Otherwise the editor creates and disposes a session while retaining the host-owned deck. Use `readOnly` for navigation without mutations.

## Build and verify locally

`examples/native-demo` is an Expo development-build example. Its Save callback writes real JSON through Expo FileSystem; its picker/resolver demonstrates URI-to-embedded-image handling. App startup runs a real native PPTX round trip before displaying the editor.

From a source checkout, install dependencies and generate the platform engine binaries first:

```sh
npm ci
npm run build
npm run build:native:ios       # macOS, Xcode, Rust iOS targets
npm run build -w @byfungsi/lipat-native
npm run ios -w @lipat/native-demo
```

The iOS builder creates an XCFramework for arm64 devices and arm64/x86_64 simulators. Android uses `npm run build:native:android` with `LIPAT_ANDROID_NDK` pointing at an installed NDK and the four Rust Android targets installed. It builds arm64-v8a, armeabi-v7a, x86_64 and x86 JNI libraries with 16 KiB-compatible ELF alignment. Native artifacts belong to the optional add-on, keeping the main package small.

`npm run verify:native` exercises the actual native C ABI, pointer ownership, Unicode, compilation, animated PPTX export/import and limits. Public adapter tests compare native Rust and WASM through the normal editing runtime. Platform application/build verification is recorded in [verification](./verification.md); a source or type check alone is not a device playback test.
