import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { createLipat, createDeck, fromMarkdown } from "@byfungsi/lipat";
import type { LipatEngine } from "@byfungsi/lipat";
import { DeckEditor, DeckPreview, DeckPlayer } from "@byfungsi/lipat/react";
import { renderDeckHtml } from "@byfungsi/lipat/render";
import { createMotionPlayback } from "@byfungsi/lipat/motion";
import { createImageLoader, embedSceneImages } from "@byfungsi/lipat/images";
import { createImageDeck } from "./image-deck";
import { createAgentTools } from "@byfungsi/lipat/agent";
import type { DeckRuntime } from "@byfungsi/lipat/core";
import wasmUrl from "@byfungsi/lipat/lipat.wasm?url";
import { sampleDeck } from "./sample-deck";
import { animationDeck } from "./animation-deck";
import "./style.css";
const motionPlayback = createMotionPlayback();
const imageLoader = createImageLoader(fetch);
const sampleImageUrl = new URL("images/fold.png", window.location.href).href;
function download(data: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function App({
  engine,
  initial,
  initialMode = "edit",
}: {
  engine: LipatEngine;
  initial: DeckRuntime;
  initialMode?: "edit" | "present";
}) {
  const [deck, setDeck] = useState(initial),
    [mode, setMode] = useState<"edit" | "present" | "source">(initialMode),
    [playerSession, setPlayerSession] = useState(0),
    [error, setError] = useState(""),
    [exporting, setExporting] = useState(false),
    [imageUrl, setImageUrl] = useState(sampleImageUrl),
    [source, setSource] = useState(
      JSON.stringify(initial.exportDocument(), null, 2),
    ),
    [agentText, setAgentText] = useState(
      "Fold your next idea into a great story.",
    );
  function replace(input: unknown) {
    const result = createDeck(input, { engine });
    if (result.ok) {
      deck.dispose();
      setDeck(result.value);
      setPlayerSession((session) => session + 1);
      setSource(JSON.stringify(result.value.exportDocument(), null, 2));
      setError("");
    } else setError(result.error.message);
  }
  async function exportDeck(format: "pptx" | "html" | "json") {
    if (format === "json") {
      download(
        JSON.stringify(deck.exportDocument(), null, 2),
        "presentation.lipat.json",
        "application/json",
      );
      return;
    }
    const compiled = deck.compile();
    if (!compiled.ok) {
      setError(compiled.error.message);
      return;
    }
    setExporting(true);
    setError("");
    try {
      const embedded = await embedSceneImages(compiled.value.scene, {
        engine,
        loader: imageLoader,
      });
      if (!embedded.ok) {
        setError(embedded.error.message);
        return;
      }
      if (format === "html") {
        download(
          renderDeckHtml(embedded.value),
          "presentation.html",
          "text/html",
        );
      } else {
        const r = engine.writePptx(embedded.value);
        if (r.ok) {
          download(
            new Uint8Array(r.value.bytes).buffer,
            "presentation.pptx",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          );
          setError(r.value.diagnostics.map((d) => d.message).join("\n"));
        } else setError(r.error.message);
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <header className="app-header">
        <a href="#" className="brand">
          <span className="fold-mark">◩</span> lipat
          <span className="version">ALPHA</span>
        </a>
        <span className="tagline">An open canvas for your next idea.</span>
        <div className="header-actions">
          <label className="file-button">
            Open file
            <input
              aria-label="Open presentation"
              type="file"
              accept=".pptx,.json,.md"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.name.endsWith(".pptx")) {
                  const r = engine.parsePptx(
                    new Uint8Array(await file.arrayBuffer()),
                  );
                  if (r.ok) {
                    const doc = engine.importScene(r.value.scene);
                    if (doc.ok) {
                      replace(doc.value);
                      setError(
                        r.value.diagnostics.map((d) => d.message).join("\n"),
                      );
                    } else setError(doc.error.message);
                  } else setError(r.error.message);
                } else if (file.name.endsWith(".md")) {
                  const r = fromMarkdown(await file.text(), {
                    id: "markdown-deck",
                  });
                  if (r.ok) replace(r.value);
                  else setError(r.error.message);
                } else {
                  try {
                    replace(JSON.parse(await file.text()));
                  } catch {
                    setError("The JSON file could not be read.");
                  }
                }
                e.target.value = "";
              }}
            />
          </label>
          <button disabled={exporting} onClick={() => exportDeck("pptx")}>
            {exporting ? "Preparing…" : "Export PPTX ↗"}
          </button>
        </div>
      </header>
      <main>
        <div className="page-heading">
          <div>
            <div className="eyebrow">THE PLAYGROUND</div>
            <h1>Give your ideas some room.</h1>
            <p>
              Author semantically. Edit precisely. Take your slides anywhere.
            </p>
          </div>
          <nav className="mode-tabs" aria-label="Workspace mode">
            {(["edit", "present", "source"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  if (value === "source")
                    setSource(JSON.stringify(deck.exportDocument(), null, 2));
                }}
              >
                {value === "edit"
                  ? "Editor"
                  : value === "present"
                    ? "Present"
                    : "Document"}
              </button>
            ))}
            <button
              onClick={() => {
                replace(animationDeck);
                setMode("present");
              }}
            >
              Animation sample
            </button>
            <button
              onClick={() => {
                replace(createImageDeck(imageUrl));
                setMode("present");
              }}
            >
              Image sample
            </button>
          </nav>
        </div>
        {error ? (
          <div role="alert" className="error">
            <button aria-label="Dismiss message" onClick={() => setError("")}>
              ×
            </button>
            {error}
          </div>
        ) : null}
        <section className="studio">
          {mode === "edit" ? (
            <DeckEditor deck={deck} onError={(e) => setError(e.message)} />
          ) : mode === "present" ? (
            <DeckPlayer
              key={playerSession}
              deck={deck}
              playback={motionPlayback}
            />
          ) : (
            <div className="source-panel">
              <label>
                DeckDocument
                <textarea
                  aria-label="Deck document"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  spellCheck={false}
                />
              </label>
              <button
                onClick={() => {
                  try {
                    replace(JSON.parse(source));
                  } catch {
                    setError("Document must be valid JSON.");
                  }
                }}
              >
                Apply document
              </button>
            </div>
          )}
        </section>
        <div className="bottom-grid">
          <section className="agent-card">
            <div className="eyebrow">FOR YOUR AGENT</div>
            <h2>Small edits. Clear intent.</h2>
            <p>
              This uses the real tool API: inspect, target a stable ID, then
              apply against the current revision.
            </p>
            <label>
              New headline
              <input
                aria-label="Agent headline"
                value={agentText}
                onChange={(e) => setAgentText(e.target.value)}
              />
            </label>
            <button
              onClick={() => {
                const tools = createAgentTools(deck, { engine });
                const outline = deck.inspect();
                const heading = outline.slides
                  .flatMap((s) => s.nodes)
                  .find((n) => n.type === "heading");
                if (!heading) {
                  setError("This deck has no heading node.");
                  return;
                }
                const r = tools.execute("lipat_apply", {
                  expectedRevision: outline.revision,
                  operations: [
                    { type: "updateText", nodeId: heading.id, text: agentText },
                  ],
                });
                if (!r.ok) setError(r.error.message);
              }}
            >
              Apply agent edit →
            </button>
            <pre>{`{ type: "updateText",\n  nodeId: "headline",\n  text: "Your next idea" }`}</pre>
            <label>
              Image URL
              <input
                aria-label="Image URL"
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
              />
            </label>
            <button
              onClick={() => {
                replace(createImageDeck(imageUrl));
                setMode("present");
              }}
            >
              Try image URL →
            </button>
            <p>
              Use a direct image link. PPTX and HTML downloads embed the image;
              its server must allow browser access.
            </p>
            <div className="export-actions">
              <button disabled={exporting} onClick={() => exportDeck("html")}>
                Download HTML
              </button>
              <button onClick={() => exportDeck("json")}>Download JSON</button>
              <button onClick={() => replace(sampleDeck)}>Reset sample</button>
            </div>
          </section>
          <section className="preview-card">
            <div className="eyebrow">READY FOR THE CONVERSATION</div>
            <h2>A preview that travels well.</h2>
            <DeckPreview
              deck={deck}
              title="presentation.pptx"
              theme="dark"
              onOpen={() => setMode("edit")}
            />
          </section>
        </div>
        <footer>
          Built with Rust. Runs in WebAssembly. Designed for what comes next.
        </footer>
      </main>
    </>
  );
}
async function start() {
  const root = document.getElementById("root");
  if (!root) throw new Error("Demo root is missing");
  try {
    const response = await fetch(wasmUrl);
    if (!response.ok)
      throw new Error(`WASM request failed: ${response.status}`);
    const engine = createLipat(new Uint8Array(await response.arrayBuffer()));
    if (!engine.ok) throw new Error(engine.error.message);
    const sample = new URLSearchParams(window.location.search).get("sample");
    const showSample = sample === "animations" || sample === "images";
    const deck = createDeck(
      sample === "animations"
        ? animationDeck
        : sample === "images"
          ? createImageDeck(sampleImageUrl)
          : sampleDeck,
      {
        engine: engine.value,
      },
    );
    if (!deck.ok) throw new Error(deck.error.message);
    createRoot(root).render(
      <StrictMode>
        <App
          engine={engine.value}
          initial={deck.value}
          initialMode={showSample ? "present" : "edit"}
        />
      </StrictMode>,
    );
  } catch (error) {
    root.textContent = error instanceof Error ? error.message : String(error);
  }
}
void start();
