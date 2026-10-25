import { requireOptionalNativeModule } from "expo-modules-core";
import { createLipatFromNative } from "@byfungsi/lipat/native";
import type { LipatNativeBridge } from "@byfungsi/lipat/native";
import type {
  LipatEngine,
  LipatOptions,
  LipatResult,
} from "@byfungsi/lipat/model";
/** Initialize the installed iOS/Android module in a development or production native build; Expo Go has no bundled Lipat module. */
export function createNativeLipat(
  options: LipatOptions = {},
): LipatResult<LipatEngine> {
  try {
    const bridge = requireOptionalNativeModule<LipatNativeBridge>("Lipat");
    if (!bridge)
      return {
        ok: false,
        error: {
          reason: "nativeUnavailable",
          message:
            "Lipat native module is not installed; rebuild the development or production native app",
        },
      };
    return createLipatFromNative(bridge, options);
  } catch {
    return {
      ok: false,
      error: {
        reason: "nativeUnavailable",
        message:
          "Lipat native module lookup failed; check native installation and rebuild the app",
      },
    };
  }
}
