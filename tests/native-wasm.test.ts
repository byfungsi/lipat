import { beforeAll, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { testEngine, inputDeck, unwrap } from "./engine-fixture";
beforeAll(() => {
  execFileSync(
    "cargo",
    [
      "build",
      "--quiet",
      "--locked",
      "-p",
      "lipat-wasm",
      "--bin",
      "lipat-native",
    ],
    { stdio: "pipe" },
  );
}, 60000);
it("native and WASM produce byte-for-byte equal JSON layout and edit results", () => {
  const engine = testEngine();
  const document = unwrap(engine.parseDocument(inputDeck));
  const native = (request: object): unknown =>
    JSON.parse(
      execFileSync("target/debug/lipat-native", {
        input: JSON.stringify(request),
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      }),
    );
  expect(native({ operation: "parseDocument", document: inputDeck })).toEqual({
    ok: true,
    value: document,
  });
  const options = {
    fonts: [
      {
        family: "Arial",
        averageWidth: 0.49,
        lineHeight: 1.3,
        glyphWidths: { W: 0.9, i: 0.2 },
      },
    ],
  };
  expect(native({ operation: "compile", document, options })).toEqual(
    engine.compile(document, options),
  );
  const operations = [
    {
      type: "setAnimation" as const,
      nodeId: "title",
      animation: { effect: "zoom" as const, durationMs: 240, delayMs: 50 },
    },
    { type: "setStep" as const, nodeId: "title", step: 2 },
    {
      type: "updateText" as const,
      nodeId: "title",
      text: "Same engine, different host",
    },
  ];
  expect(native({ operation: "apply", document, operations })).toEqual(
    engine.applyDocument(document, operations),
  );
  const animated = unwrap(engine.applyDocument(document, operations));
  expect(native({ operation: "compile", document: animated, options })).toEqual(
    engine.compile(animated, options),
  );
  const scene = unwrap(engine.compile(animated, options)).scene;
  const output = unwrap(engine.writePptx(scene));
  expect(native({ operation: "writePptx", scene })).toEqual({
    ok: true,
    value: {
      bytes: Buffer.from(output.bytes).toString("base64"),
      diagnostics: output.diagnostics,
    },
  });
  expect(
    native({
      operation: "parsePptx",
      bytes: Buffer.from(output.bytes).toString("base64"),
    }),
  ).toEqual(engine.parsePptx(output.bytes));
});
