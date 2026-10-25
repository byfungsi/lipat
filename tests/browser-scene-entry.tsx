import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ScenePlayer, ScenePreview } from "@byfungsi/lipat/react";
import { createMotionPlayback } from "@byfungsi/lipat/motion";
import { artifactScene } from "./scene-fixture";
const playback = createMotionPlayback();
function SceneBrowserFixture() {
  const [allow, setAllow] = useState(false),
    [replaced, setReplaced] = useState(false);
  return (
    <>
      <button onClick={() => setAllow((value) => !value)}>
        Toggle external images
      </button>
      <button onClick={() => setReplaced(true)}>Replace scene</button>
      <ScenePlayer
        scene={replaced ? { ...artifactScene, slides: [] } : artifactScene}
        playback={playback}
        imagePolicy={allow ? "allow-external" : "embedded-only"}
      />
      <ScenePreview
        scene={artifactScene}
        imagePolicy={allow ? "allow-external" : "embedded-only"}
      />
    </>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Scene browser root missing");
createRoot(root).render(<SceneBrowserFixture />);
