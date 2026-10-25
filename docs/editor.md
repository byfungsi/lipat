# Built-in editor

`DeckEditor` is a reusable editing view. It includes slide management, a content palette, drag and drop, element movement/resizing, layers, properties, rich text, tables, image insertion, notes, themes, animation settings, diagnostics and undo/redo. The individual canvas, tabs, inspector and history controls remain composable.

```tsx
import { DeckEditor } from "@byfungsi/lipat/react";
import { createMotionPlayback } from "@byfungsi/lipat/motion";
import "@byfungsi/lipat/editor.css";

const playback = createMotionPlayback();

<DeckEditor
  deck={deck}
  playback={playback}
  onSave={async (document) => {
    // Persist JSON, call your API or compile/export using your host-owned engine.
    const result = await presentations.save(document);
    return result; // void or LipatResult<void>, sync or async
  }}
  onError={(error) => showError(error.message)}
/>;
```

The optional stylesheet is scoped to `.lipat-editor`; importing the JavaScript never imports global CSS. Supply `className` to integrate your own styling. Create the deck once, outside render or in a lazy state initializer. The editor does not dispose the host's runtime.

## Save ownership

Save receives the immutable `DeckDocument` snapshot captured when the button was pressed. The application decides where and how to persist it. Lipat disables duplicate submissions while the callback is pending. Successful completion marks only that snapshot saved: changes made while saving remain dirty. Errors remain retryable and never falsely clear unsaved changes. A rejected host callback is translated to `saveFailed`; return a `LipatResult` for an application-specific error message.

Changes to callback identity on host rerenders do not reset history, task state or unsaved changes. Replacing the runtime or unmounting an owned session cancels its pending editing work. Lipat does not roll back a remote upload or save that the host has already performed. The callback context has `isCancelled()` and a session-local `taskId`; use your own durable version/idempotency key for remote persistence. Callbacks are never automatically retried.

An application needing independent toolbar/state ownership can create a session:

```ts
import { createDeckEditorSession } from "@byfungsi/lipat/core";
const session = createDeckEditorSession(deck, { onSave, resolveImage });
// Pass session to DeckEditor; subscribe to session.getState()/session.subscribe.
// Dispose this host-owned session when its lifetime ends. It does not dispose deck.
```

A supplied session must belong to the supplied deck. The UI's `readOnly` capability removes mutation controls; a headless session may independently enforce `readOnly: true`.

## Images and arbitrary host workflows

The editor accepts PNG, JPEG, GIF and WebP files, dropped files and HTTP(S) image URLs. Without a resolver, file bytes become embedded assets and URLs remain linked sources. Images are inserted only after resolution, as one undoable edit. Upload failure, cancellation or deletion of the target slide never commits a placeholder or partial document.

Pass `resolveImage` to upload to S3/R2, call a command, resize/scan an image, or perform any other asynchronous preparation before returning the final URL or embedded asset. The SDK contains no bucket credentials, network singleton or storage client.

```tsx
<DeckEditor
  deck={deck}
  resolveImage={async (input, context) => {
    if (input.kind === "url") return { ok: true, value: { url: input.url } };
    if (input.kind !== "bytes") {
      return {
        ok: false,
        error: {
          reason: "invalidImage",
          message: "This web uploader accepts file bytes",
        },
      };
    }
    // This application-owned client can request a signed S3/R2 upload, PUT the
    // bytes, finalize processing and return a durable CDN URL.
    const uploaded = await imageUploads.uploadAndProcess({
      bytes: input.bytes,
      contentType: input.mimeType,
      filename: input.name,
      isCancelled: context.isCancelled,
    });
    if (!uploaded.ok) return uploaded;
    if (context.isCancelled()) {
      return {
        ok: false,
        error: { reason: "cancelled", message: "Image insertion cancelled" },
      };
    }
    return {
      ok: true,
      value: { url: uploaded.value.publicUrl, alt: input.name },
    };
  }}
/>
```

The resolver can instead return `{ok:true,value:{asset:{id,mimeType,data},alt}}`; `data` is validated base64. Existing asset IDs should only be reused for identical content. Native pickers can pass `{kind:'uri',uri,name,mimeType?}` and resolve it using their app's filesystem/upload capability. Byte and URL inputs are also portable. URI input requires a resolver.

The file picker has a 32 MiB per-file admission limit. The engine's configurable limits still admit the resulting document/assets. Hosts should set tighter profiles as needed. External images require a usable URL and relevant host permissions/CORS when embedding for offline export. Returning a permanent public/CDN URL avoids persisting temporary local or signed upload URLs.

## Editing and layout

Click the palette to insert an element, or drag a palette item onto the canvas. Selecting a container in Layers lets palette clicks append content to that container. Dragging onto the canvas creates freeform content at the dropped position. Files and URL drops use the image workflow.

Drag elements to move them; Shift-select for multi-element movement. Use the resize handle or arrow keys on the focused element/handle; Shift changes the amount to ten points. Escape or pointer cancellation discards a gesture. A committed gesture creates one history entry and checks the original revision, preventing stale gestures from overwriting concurrent edits.

Freeform editing resolves the slide's semantic layout into an editable canvas using the same native conversion used for imported PPTX. Conversion and the requested edit commit together and undo together. Primitive IDs, resolved geometry, content and animation are retained; semantic containers are intentionally replaced by positioned primitives. Properties and semantic container edits can continue using ordinary source operations without converting the slide.

Slide tabs can be reordered by dragging, with earlier/later controls as a keyboard alternative. Layers expose selection, duplicate/delete and front/back/forward/backward order. The inspector supports content and style editing, frame and rotation, shape paint/geometry, image fit/alt text, semantic layout, table data, notes and portable animation data.

## Animation

For each primitive, set a nonnegative reveal step (zero means automatic), choose `fade`, `rise`, `slide` or `zoom`, and edit duration/delay in milliseconds and easing. Choose `none` to remove the effect. Preview/replay works by default through the built-in browser animation driver. Supply `createMotionPlayback()` to use Motion instead; both drivers share reveal transitions, easing, reduced motion and cleanup. ScenePlayer step navigation remains available without a driver.

These settings are document data. They survive save/reload, history, native rendering and the supported PPTX animation export/import subset. They do not turn arbitrary Motion timelines, springs or CSS animation into portable PowerPoint effects. See [animation support](./animations.md).

Keyboard shortcuts outside text inputs: Ctrl/Cmd-S saves, Ctrl/Cmd-Z undoes, Shift-Ctrl/Cmd-Z redoes, Ctrl/Cmd-D duplicates selection and Delete/Backspace removes selection.

The slide properties also expose **Vertical group**. Choose an earlier top-level slide as a parent for reveal.js vertical grouping, or return to a top-level slide. Built-in players keep linear navigation; the reveal adapter uses this metadata. Invalid grouping or moves fail atomically.
