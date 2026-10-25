import type {
  ImportedPresentation,
  LipatEngine,
  LipatResult,
  PptxExport,
  SlideScene,
} from "@lipat-internal/model";
/** Parse PPTX bytes independently of the creation runtime. Hosts own file access. */
export function parsePptx(
  bytes: Uint8Array,
  options: { readonly engine: LipatEngine },
): LipatResult<ImportedPresentation> {
  return options.engine.parsePptx(bytes);
}
/** Export an already resolved scene; parsing and authoring are not prerequisites. */
export function writePptx(
  scene: SlideScene,
  options: { readonly engine: LipatEngine },
): LipatResult<PptxExport> {
  return options.engine.writePptx(scene);
}
