import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { ScenePreview, ScenePlayer } from "@byfungsi/lipat/react";
import { createMotionPlayback } from "@byfungsi/lipat/motion";
import { sceneSample } from "./scene-sample";
import "./scene-style.css";
const playback = createMotionPlayback();
function SceneDemo() {
  const [present, setPresent] = useState(false);
  return (
    <main>
      <header>
        <a href="./index.html">◩ lipat</a>
        <span>SCENE VIEWER</span>
      </header>
      <h1>Already resolved. Ready to view.</h1>
      <p>
        This read-only example displays an immutable scene without loading
        WebAssembly or creating an editing runtime. Images are embedded in the
        artifact.
      </p>
      <nav aria-label="Viewer mode">
        <button aria-pressed={!present} onClick={() => setPresent(false)}>
          Preview
        </button>
        <button aria-pressed={present} onClick={() => setPresent(true)}>
          Present
        </button>
      </nav>
      <section>
        {present ? (
          <ScenePlayer scene={sceneSample} playback={playback} />
        ) : (
          <ScenePreview scene={sceneSample} />
        )}
      </section>
      <footer>
        <code>
          {present
            ? "<ScenePlayer scene={scene} />"
            : "<ScenePreview scene={scene} />"}
        </code>
        <span>Embedded images only</span>
      </footer>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Scene viewer root is missing");
createRoot(root).render(
  <StrictMode>
    <SceneDemo />
  </StrictMode>,
);
