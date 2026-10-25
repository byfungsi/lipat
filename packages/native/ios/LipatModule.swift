import ExpoModulesCore
import LipatRustCore

/// Synchronous JSON calls use the same Rust dispatcher as WASM; no browser runtime or WebView is involved.
public final class LipatModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Lipat")
    Function("getAbiVersion") { Int(lipat_native_abi_version()) }
    Function("executeJson") { (request: String) -> String in
      request.withCString { input in
        let bytes = UnsafeRawPointer(input).assumingMemoryBound(to: UInt8.self)
        guard let response = lipat_native_execute(bytes, request.lengthOfBytes(using: .utf8)) else {
          return "{\"ok\":false,\"error\":{\"reason\":\"engineFailure\",\"message\":\"Lipat native response allocation failed\"}}"
        }
        defer { lipat_native_free(response) }
        return String(cString: response)
      }
    }
  }
}
