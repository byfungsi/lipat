import { createJsonLipatEngine } from "@lipat-internal/engine";
import type { LipatEngine, LipatResult, LipatOptions } from "@lipat-internal/model";
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
  const encoder = new TextEncoder(), decoder = new TextDecoder();
  return createJsonLipatEngine({
    executeJson(request) {
      const input = encoder.encode(request);
      let pointer: number | undefined, outputPointer: number | undefined, outputLength = 0;
      try {
        pointer = exports.lipat_alloc(input.byteLength);
        new Uint8Array(exports.memory.buffer, pointer, input.byteLength).set(input);
        const packed = exports.lipat_execute(pointer, input.byteLength);
        outputPointer = Number(packed & 0xffffffffn); outputLength = Number(packed >> 32n);
        return decoder.decode(new Uint8Array(exports.memory.buffer, outputPointer, outputLength));
      } finally {
        if(pointer !== undefined) exports.lipat_free(pointer, input.byteLength);
        if(outputPointer !== undefined) exports.lipat_free(outputPointer, outputLength);
      }
    },
  }, options);
}
