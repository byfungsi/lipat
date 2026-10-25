# Editor and React Native delivery

The requested outcome is a reusable editor on the web, React Native support, host-owned save and image workflows (including upload/commands before obtaining the final URL), and editing of all Lipat content and portable animation features.

The current browser editor supplies text/notes and basic gestures. Extend it without removing the composable components or read-only views. Keep persistence and image processing behind explicit callbacks; never assume a bucket, credential, database or network client. A headless editing session owns pending work, cancellation, dirty/save state and atomic content commands. Browser and native views subscribe to it; the runtime remains the single source of document/history truth.

Freeform edits can explicitly resolve semantic layouts to canvas geometry, using the native scene-to-document conversion. Conversion and the requested edit form one transaction, retain primitive IDs/appearance and undo together. Semantic editing remains available through the existing document operations.

React Native must include native views and a supported engine path without relying on Hermes implementing browser WebAssembly. Native rendering uses resolved scenes; native parsing/compilation/export must call the same Rust dispatcher. Platform I/O stays with the host. Nori's current GitHub main has no React Native entrypoint; do not invent parity evidence from it.

Completion evidence still required:

- Public built-in editor: slide create/duplicate/delete/reorder, all content kinds, text/rich formatting, tables, shape/image options, frame/rotation, layering, theme, semantic layout, undo/redo, keyboard/pointer drag/drop/resize, read-only behavior and diagnostics.
- Save callback: immutable snapshot, pending/error/retry states, no duplicate submission, edits during save remain dirty, no false saved state after failure or replacement.
- Image resolver: embedded bytes, direct URL, asynchronous host URL/asset return after arbitrary work, no insertion before resolution, cancellation/stale target/failure handling, file and palette drop.
- Animation editor: reveal step, four effects, duration, delay, easing, clearing, preview/replay and preservation in JSON/PPTX.
- React Native: importable isolated entrypoint, preview/player/editor, touch editing and host callbacks, rendering policies and reduced motion, native engine bridge/build setup and real native execution evidence.
- Examples/docs and appropriate native/WASM, browser, package-boundary and packed-consumer checks. Publication remains separately auditable; do not claim complete based on a smaller passing subset.
