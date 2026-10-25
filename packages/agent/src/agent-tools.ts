import type { DeckRuntime } from "@lipat-internal/core";
import type {
  DeckOperation,
  LipatEngine,
  LipatResult,
} from "@lipat-internal/model";
import { encodeAssetBytes } from "@lipat-internal/model";
import { renderDeckHtml, renderSlideSvg } from "@lipat-internal/render";
import schemas from "./schemas.json";
/** Provider-neutral tool description; register with the agent framework of your choice. */
export interface AgentToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: object;
}
/** Tool execution returns ordinary JSON data, SVG/HTML text or base64 bytes. */
export interface DeckAgentTools {
  readonly tools: readonly AgentToolDefinition[];
  /** Execute one provider-neutral tool; invalid input and revision conflicts are returned as values. */
  execute(name: string, input: unknown): LipatResult<unknown>;
}
function objectInput(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
/** Expose native-generated document and operation JSON schemas for structured generation. */
export const deckSchemas = schemas;
/** Inspect → atomic edit → compile → preview → export, with no model-provider dependency. */
export function createAgentTools(
  deck: DeckRuntime,
  options: { readonly engine: LipatEngine },
): DeckAgentTools {
  const operationSchema = { ...schemas.operation };
  const definitions = operationSchema.definitions;
  const tools: AgentToolDefinition[] = [
    {
      name: "lipat_inspect",
      description:
        "Read deck revision, stable slide/node identities and compact semantic content.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          slideId: { type: "string" },
          maxTextLength: { type: "integer", minimum: 0, maximum: 10000 },
        },
      },
    },
    {
      name: "lipat_apply",
      description:
        "Apply an atomic batch against expectedRevision. On conflict, inspect again. Failed batches change nothing.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["expectedRevision", "operations"],
        properties: {
          expectedRevision: { type: "integer", minimum: 0 },
          operations: {
            type: "array",
            maxItems: 10000,
            items: { oneOf: operationSchema.oneOf },
          },
        },
        definitions,
      },
    },
    {
      name: "lipat_compile",
      description:
        "Resolve layout and inspect overflow, font and compatibility diagnostics with node identities.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {},
      },
    },
    {
      name: "lipat_preview",
      description:
        "Return SVG for a slide after compilation. Hosts may rasterize SVG for visual model input.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["slideId"],
        properties: { slideId: { type: "string" } },
      },
    },
    {
      name: "lipat_export",
      description:
        "Export a compiled presentation as PPTX (base64), self-contained HTML or the source JSON document.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["format"],
        properties: { format: { enum: ["pptx", "html", "json"] } },
      },
    },
  ];
  const invalid = (message: string): LipatResult<never> => ({
    ok: false,
    error: { reason: "invalidToolInput", message },
  });
  return {
    tools,
    execute(name, input) {
      if (!objectInput(input))
        return invalid("Tool input must be a JSON object");
      switch (name) {
        case "lipat_inspect": {
          if (input.slideId !== undefined && typeof input.slideId !== "string")
            return invalid("slideId must be text");
          if (
            input.maxTextLength !== undefined &&
            (!Number.isInteger(input.maxTextLength) ||
              typeof input.maxTextLength !== "number" ||
              input.maxTextLength < 0 ||
              input.maxTextLength > 10000)
          )
            return invalid("maxTextLength must be an integer from 0 to 10000");
          return {
            ok: true,
            value: deck.inspect({
              ...(typeof input.slideId === "string"
                ? { slideId: input.slideId }
                : {}),
              ...(typeof input.maxTextLength === "number"
                ? { maxTextLength: input.maxTextLength }
                : {}),
            }),
          };
        }
        case "lipat_apply": {
          if (
            !Number.isInteger(input.expectedRevision) ||
            typeof input.expectedRevision !== "number" ||
            input.expectedRevision < 0 ||
            !Array.isArray(input.operations)
          )
            return invalid(
              "An expectedRevision and operations array are required",
            );
          // SAFETY: The engine parses every operation through Rust serde and validates the final document before committing.
          const operations = input.operations as readonly DeckOperation[];
          const result = deck.apply(operations, {
            expectedRevision: input.expectedRevision,
          });
          return result.ok ? { ok: true, value: deck.inspect() } : result;
        }
        case "lipat_compile":
          return deck.compile();
        case "lipat_preview": {
          if (typeof input.slideId !== "string")
            return invalid("slideId is required");
          const compiled = deck.compile();
          if (!compiled.ok) return compiled;
          const svg = renderSlideSvg(compiled.value.scene, input.slideId);
          return svg
            ? {
                ok: true,
                value: {
                  mimeType: "image/svg+xml",
                  svg,
                  diagnostics: compiled.value.diagnostics,
                },
              }
            : invalid("Slide identity does not exist");
        }
        case "lipat_export": {
          if (input.format === "json")
            return { ok: true, value: deck.exportDocument() };
          if (input.format !== "pptx" && input.format !== "html")
            return invalid("format must be pptx, html or json");
          const compiled = deck.compile();
          if (!compiled.ok) return compiled;
          if (input.format === "html")
            return {
              ok: true,
              value: {
                mimeType: "text/html",
                html: renderDeckHtml(compiled.value.scene),
                diagnostics: compiled.value.diagnostics,
              },
            };
          const exported = options.engine.writePptx(compiled.value.scene);
          return exported.ok
            ? {
                ok: true,
                value: {
                  mimeType:
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                  base64: encodeAssetBytes(exported.value.bytes),
                  diagnostics: [
                    ...compiled.value.diagnostics,
                    ...exported.value.diagnostics,
                  ],
                },
              }
            : exported;
        }
        default:
          return invalid(`Unknown Lipat tool: ${name}`);
      }
    },
  };
}
