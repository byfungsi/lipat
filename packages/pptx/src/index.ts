import type {
  ImportedPresentation,
  LipatEngine,
  LipatResult,
  PptxExport,
  SlideScene,
} from "@lipat-internal/model";
import { embedSceneImages } from "@lipat-internal/images";
import type { ImageLoader } from "@lipat-internal/images";
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
/** Fetch and embed URL images before exporting an offline PPTX; source scenes remain unchanged. */
export async function writePptxWithImages(
  scene: SlideScene,
  options: { readonly engine: LipatEngine; readonly loader: ImageLoader },
): Promise<LipatResult<PptxExport>> {
  const embedded = await embedSceneImages(scene, options);
  return embedded.ok ? options.engine.writePptx(embedded.value) : embedded;
}
