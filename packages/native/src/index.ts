import { createJsonLipatEngine } from "@lipat-internal/engine";
import type {
  LipatEngine,
  LipatOptions,
  LipatResult,
} from "@lipat-internal/model";
/** Native mobile module contract; synchronous execution keeps the ordinary editable runtime available in Hermes without WebAssembly. */
export interface LipatNativeBridge {
  getAbiVersion(): number;
  executeJson(request: string): string;
}
/** Connect an explicit native Lipat module; no implicit module lookup, network, global patching or WASM compilation occurs. */
export function createLipatFromNative(
  bridge: LipatNativeBridge,
  options: LipatOptions = {},
): LipatResult<LipatEngine> {
  try {
    if (bridge.getAbiVersion() !== 1)
      return {
        ok: false,
        error: {
          reason: "nativeUnavailable",
          message: "Lipat native bridge ABI version must be 1",
        },
      };
    const result = createJsonLipatEngine(bridge, options);
    if (!result.ok) return result;
    // Probe the actual dispatcher before accepting a host module with an incompatible protocol.
    const probe: unknown = JSON.parse(
      bridge.executeJson('{"operation":"resourceLimits"}'),
    );
    if (
      !probe ||
      typeof probe !== "object" ||
      !("ok" in probe) ||
      probe.ok !== true
    )
      return {
        ok: false,
        error: {
          reason: "nativeUnavailable",
          message: "Lipat native bridge protocol check failed",
        },
      };
    return result;
  } catch {
    return {
      ok: false,
      error: {
        reason: "nativeUnavailable",
        message: "Lipat native bridge initialization failed",
      },
    };
  }
}
