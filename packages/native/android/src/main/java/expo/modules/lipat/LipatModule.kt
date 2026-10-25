package expo.modules.lipat

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Synchronous JNI execution shares Rust validation, budgets, layout and PPTX with every other Lipat host. */
class LipatModule : Module() {
  companion object { init { System.loadLibrary("lipat_mobile") } }
  private external fun executeNative(request: String): String
  private external fun getAbiVersionNative(): Int
  override fun definition() = ModuleDefinition {
    Name("Lipat")
    Function("getAbiVersion") { getAbiVersionNative() }
    Function("executeJson") { request: String -> executeNative(request) }
  }
}
