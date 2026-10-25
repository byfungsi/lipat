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
/** A synchronous JSON transport calls the bundled Rust protocol without choosing a host runtime. */
export interface LipatJsonTransport {
  executeJson(request: string): string;
}
function utf8Length(text: string): number {
  let count = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    count += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return count;
}
/** Own serialization, admission and byte encoding once for WASM and native hosts. The transport owns only execution and native resources. */
export function createJsonLipatEngine(
  transport: LipatJsonTransport,
  options: LipatOptions = {},
): LipatResult<LipatEngine> {
  let limits: ResourceLimits | undefined = options.limits;
  let maxRequestBytes = 96 * 1024 * 1024,
    maxPptxBytes = 32 * 1024 * 1024;
  function request<T>(value: object): LipatResult<T> {
    let input: string;
    try {
      input = JSON.stringify({
        ...value,
        ...(limits !== undefined ? { limits } : {}),
      });
    } catch {
      return {
        ok: false,
        error: {
          reason: "invalidInput",
          message: "Lipat request must be JSON serializable",
        },
      };
    }
    if (utf8Length(input) > maxRequestBytes)
      return {
        ok: false,
        error: {
          reason: "resourceLimit",
          message: "Lipat resource limit exceeded: maxRequestBytes",
        },
      };
    try {
      const output: unknown = JSON.parse(transport.executeJson(input));
      if (
        !output ||
        typeof output !== "object" ||
        !("ok" in output) ||
        typeof output.ok !== "boolean" ||
        (output.ok ? !("value" in output) : !("error" in output))
      )
        return {
          ok: false,
          error: {
            reason: "engineFailure",
            message: "Lipat engine returned an invalid Result envelope",
          },
        };
      // SAFETY: The host-supplied trusted Lipat ABI serializes validated, operation-specific payloads; envelope shape is checked above.
      const result = output as LipatResult<T>;
      return result.ok
        ? { ok: true, value: freezeDocument(result.value) }
        : result;
    } catch {
      return {
        ok: false,
        error: {
          reason: "engineFailure",
          message: "Lipat engine execution failed",
        },
      };
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
