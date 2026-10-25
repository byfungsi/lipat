import { execFileSync } from "node:child_process";
import { beforeAll, it, expect } from "vitest";
import { createLipatFromNative } from "@byfungsi/lipat/native";
import { createDeck } from "@byfungsi/lipat/core";
import type { LipatNativeBridge } from "@byfungsi/lipat/native";
import { testEngine, inputDeck, unwrap } from "./engine-fixture";
beforeAll(() => {
  execFileSync(
    "cargo",
    ["build", "--quiet", "-p", "lipat-wasm", "--bin", "lipat-native"],
    { stdio: "pipe" },
  );
}, 60000);
const bridge: LipatNativeBridge = {
  getAbiVersion: () => 1,
  executeJson: (request) =>
    execFileSync("target/debug/lipat-native", {
      input: request,
      encoding: "utf8",
    }),
};
it("connects the same headless runtime to native Rust without a WebAssembly transport", () => {
  const native = unwrap(createLipatFromNative(bridge)),
    wasm = testEngine();
  const a = unwrap(native.parseDocument(inputDeck)),
    b = unwrap(wasm.parseDocument(inputDeck));
  expect(a).toEqual(b);
  expect(native.compile(a)).toEqual(wasm.compile(b));
  const deck = unwrap(createDeck(a, { engine: native }));
  unwrap(
    deck.apply([
      {
        type: "updateDocument",
        title: "Native editor",
        size: { width: 1200, height: 675 },
      },
    ]),
  );
  expect(deck.exportDocument()).toMatchObject({
    title: "Native editor",
    size: { width: 1200, height: 675 },
  });
  expect(native.compile(deck.exportDocument())).toEqual(
    wasm.compile(deck.exportDocument()),
  );
  unwrap(
    deck.applyToCanvas("s1", [
      {
        type: "setFrame",
        nodeId: "title",
        frame: { x: 10, y: 20, width: 400, height: 80 },
      },
    ]),
  );
  const scene = unwrap(deck.compile()).scene;
  const bytes = unwrap(native.writePptx(scene)).bytes;
  expect(native.parsePptx(bytes)).toEqual(wasm.parsePptx(bytes));
  const limited = unwrap(
    createLipatFromNative(bridge, { limits: { maxNodes: 1 } }),
  );
  expect(limited.parseDocument(inputDeck)).toMatchObject({
    ok: false,
    error: { reason: "resourceLimit" },
  });
});
it("rejects incompatible native ABI/protocol and translates execution failures", () => {
  expect(
    createLipatFromNative({ ...bridge, getAbiVersion: () => 2 }),
  ).toMatchObject({ ok: false, error: { reason: "nativeUnavailable" } });
  expect(
    createLipatFromNative({ ...bridge, executeJson: () => "{}" }),
  ).toMatchObject({ ok: false, error: { reason: "nativeUnavailable" } });
  let fail = false;
  const engine = unwrap(
    createLipatFromNative({
      ...bridge,
      executeJson: (request) => {
        if (fail) throw Error("private host detail");
        return bridge.executeJson(request);
      },
    }),
  );
  fail = true;
  expect(engine.parseDocument(inputDeck)).toEqual({
    ok: false,
    error: {
      reason: "engineFailure",
      message: "Lipat engine execution failed",
    },
  });
});
