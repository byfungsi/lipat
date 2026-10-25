import {
  decodeAssetBytes,
  encodeAssetBytes,
  freezeDocument,
} from "@lipat-internal/model";
import type {
  CompileOutput,
  DeckDocument,
  ImportedPresentation,
  LipatEngine,
  LipatResult,
  LipatOptions,
  ResourceLimits,
  PptxExport,
} from "@lipat-internal/model";
interface WasmExports {
  memory: WebAssembly.Memory;
  lipat_alloc: (len: number) => number;
  lipat_free: (ptr: number, len: number) => void;
  lipat_execute: (ptr: number, len: number) => bigint;
}
/** Instantiate the bundled Rust engine from host-supplied bytes; performs no implicit fetching. */
export function createLipat(
  wasmBytes: Uint8Array,
  options: LipatOptions = {},
): LipatResult<LipatEngine> {
  try {
    return createLipatFromModule(
      new WebAssembly.Module(new Uint8Array(wasmBytes)),
      options,
    );
  } catch (error) {
    return initializationFailure(error);
  }
}
function initializationFailure(error: unknown): LipatResult<never> {
  return {
    ok: false,
    error: {
      reason: "wasmUnavailable",
      message: `Lipat WebAssembly initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    },
  };
}
/** Instantiate a host-precompiled Lipat WebAssembly.Module; its object/ABI is checked at runtime without DOM ambient types. Never compiles bytes or fetches. */
export function createLipatFromModule(
  module: object,
  options: LipatOptions = {},
): LipatResult<LipatEngine> {
  let exports: WasmExports;
  try {
    const instance = new WebAssembly.Instance(module, {});
    const e = instance.exports;
    if (
      !(e.memory instanceof WebAssembly.Memory) ||
      typeof e.lipat_alloc !== "function" ||
      typeof e.lipat_free !== "function" ||
      typeof e.lipat_execute !== "function"
    )
      return {
        ok: false,
        error: {
          reason: "wasmUnavailable",
          message: "Lipat WebAssembly ABI exports are missing",
        },
      };
    // SAFETY: Required exports were checked above; the bundled Rust module defines this ABI.
    exports = e as unknown as WasmExports;
  } catch (error) {
    return initializationFailure(error);
  }
  const encoder = new TextEncoder(),
    decoder = new TextDecoder();
  let limits: ResourceLimits | undefined = options.limits;
  let maxRequestBytes = 96 * 1024 * 1024;
  let maxPptxBytes = 32 * 1024 * 1024;
  function request<T>(value: object): LipatResult<T> {
    let input: Uint8Array;
    try {
      input = encoder.encode(
        JSON.stringify({
          ...value,
          ...(limits !== undefined ? { limits } : {}),
        }),
      );
    } catch {
      return {
        ok: false,
        error: {
          reason: "invalidInput",
          message: "Lipat request must be JSON serializable",
        },
      };
    }
    if (input.byteLength > maxRequestBytes)
      return {
        ok: false,
        error: {
          reason: "resourceLimit",
          message: "Lipat resource limit exceeded: maxRequestBytes",
        },
      };
    let pointer: number | undefined;
    let outputPointer: number | undefined,
      outputLength = 0;
    try {
      pointer = exports.lipat_alloc(input.byteLength);
      new Uint8Array(exports.memory.buffer, pointer, input.byteLength).set(
        input,
      );
      const packed = exports.lipat_execute(pointer, input.byteLength);
      outputPointer = Number(packed & 0xffffffffn);
      outputLength = Number(packed >> 32n);
      const json = decoder.decode(
        new Uint8Array(exports.memory.buffer, outputPointer, outputLength),
      );
      // SAFETY: The bundled Rust engine serializes operation-specific, validated Result payloads.
      const result = JSON.parse(json) as LipatResult<T>;
      return result.ok
        ? { ok: true, value: freezeDocument(result.value) }
        : result;
    } catch (error) {
      return {
        ok: false,
        error: {
          reason: "engineFailure",
          message: `Lipat engine execution failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      };
    } finally {
      if (pointer !== undefined) exports.lipat_free(pointer, input.byteLength);
      if (outputPointer !== undefined)
        exports.lipat_free(outputPointer, outputLength);
    }
  }
  if (limits !== undefined) {
    const parsed = request<ResourceLimits>({ operation: "resourceLimits" });
    if (!parsed.ok) return parsed;
    limits = parsed.value;
    maxRequestBytes = limits.maxRequestBytes ?? maxRequestBytes;
    maxPptxBytes = limits.maxPptxBytes ?? maxPptxBytes;
  }
  return {
    ok: true,
    value: {
      parseDocument: (document) =>
        request<DeckDocument>({ operation: "parseDocument", document }),
      compile: (document, options = {}) =>
        request<CompileOutput>({ operation: "compile", document, options }),
      applyDocument: (document, operations) =>
        request<DeckDocument>({ operation: "apply", document, operations }),
      parsePptx(bytes) {
        if (bytes.byteLength > maxPptxBytes)
          return {
            ok: false,
            error: {
              reason: "resourceLimit",
              message: "Lipat resource limit exceeded: maxPptxBytes",
            },
          };
        return request<ImportedPresentation>({
          operation: "parsePptx",
          bytes: encodeAssetBytes(bytes),
        });
      },
      writePptx(scene): LipatResult<PptxExport> {
        const result = request<{
          readonly bytes: string;
          readonly diagnostics: PptxExport["diagnostics"];
        }>({ operation: "writePptx", scene });
        return result.ok
          ? {
              ok: true,
              value: {
                bytes: decodeAssetBytes(result.value.bytes),
                diagnostics: result.value.diagnostics,
              },
            }
          : result;
      },
      importScene: (scene) =>
        request<DeckDocument>({ operation: "importPptx", scene }),
    },
  };
}
