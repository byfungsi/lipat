import { expect, it } from "vitest";
import fc from "fast-check";
import { createAgentTools } from "@byfungsi/lipat/agent";
import { testDeck, testEngine, unwrap } from "./engine-fixture";

it("lets agents add, compile, remove and undo animation and step edits atomically", () => {
  const engine = testEngine();
  const deck = testDeck(engine);
  const tools = createAgentTools(deck, { engine });
  const result = tools.execute("lipat_apply", {
    expectedRevision: 0,
    operations: [
      { type: "setAnimation", nodeId: "title", animation: { effect: "rise" } },
      { type: "setStep", nodeId: "title", step: 2 },
    ],
  });
  expect(result.ok).toBe(true);
  expect(
    deck.inspect().slides[0]?.nodes.find((node) => node.id === "title"),
  ).toMatchObject({
    step: 2,
    animation: { effect: "rise" },
  });
  const scene = unwrap(deck.compile()).scene;
  expect(scene.slides[0]?.elements[0]).toMatchObject({
    step: 2,
    animation: {
      effect: "rise",
      durationMs: 350,
      delayMs: 0,
      easing: "easeOut",
    },
  });
  expect(unwrap(engine.importScene(scene)).slides[0]?.content).toMatchObject({
    children: [
      expect.objectContaining({
        animation: {
          effect: "rise",
          durationMs: 350,
          delayMs: 0,
          easing: "easeOut",
        },
      }),
      expect.anything(),
      expect.anything(),
    ],
  });
  const exported = unwrap(engine.writePptx(scene));
  expect(exported.diagnostics).toContainEqual(
    expect.objectContaining({
      code: "animationEasingApproximation",
      nodeId: "title",
      slideId: "s1",
    }),
  );
  expect(
    unwrap(engine.parsePptx(exported.bytes)).scene.slides[0]?.elements[0],
  ).toMatchObject({
    step: 2,
    animation: {
      effect: "rise",
      durationMs: 350,
      delayMs: 0,
      easing: "easeOut",
    },
  });
  unwrap(
    deck.apply([
      { type: "setAnimation", nodeId: "title", animation: null },
      { type: "setStep", nodeId: "title", step: null },
    ]),
  );
  expect(
    unwrap(deck.compile()).scene.slides[0]?.elements[0]?.animation,
  ).toBeUndefined();
  deck.undo();
  expect(
    unwrap(deck.compile()).scene.slides[0]?.elements[0]?.animation?.effect,
  ).toBe("rise");
});

it("rejects invalid effects, executable props, container animation and timing without committing", () => {
  const engine = testEngine();
  const deck = testDeck(engine);
  const tools = createAgentTools(deck, { engine });
  for (const animation of [
    { effect: "explode" },
    { effect: "fade", durationMs: -1 },
    { effect: "fade", delayMs: 60001 },
    { effect: "fade", onComplete: "script" },
  ]) {
    expect(
      tools.execute("lipat_apply", {
        expectedRevision: 0,
        operations: [
          { type: "updateText", nodeId: "title", text: "Must not commit" },
          { type: "setAnimation", nodeId: "title", animation },
        ],
      }).ok,
    ).toBe(false);
    expect(deck.getState().revision).toBe(0);
  }
  expect(
    deck.apply([
      { type: "setAnimation", nodeId: "body", animation: { effect: "fade" } },
    ]).ok,
  ).toBe(false);
  expect(deck.getState().canUndo).toBe(false);
});

it("preserves bounded animation timing through validation and compilation", () => {
  const engine = testEngine();
  const deck = testDeck(engine);
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 10000 }),
      fc.integer({ min: 0, max: 60000 }),
      fc.constantFrom(
        "fade" as const,
        "rise" as const,
        "slide" as const,
        "zoom" as const,
      ),
      (durationMs, delayMs, effect) => {
        unwrap(
          deck.apply([
            {
              type: "setAnimation",
              nodeId: "title",
              animation: { effect, durationMs, delayMs },
            },
          ]),
        );
        expect(
          unwrap(deck.compile()).scene.slides[0]?.elements[0]?.animation,
        ).toMatchObject({ effect, durationMs, delayMs });
      },
    ),
    { numRuns: 30 },
  );
});

it("exports portable entrances and reveal groups through native timing without losing target geometry", () => {
  const engine = testEngine();
  const deck = testDeck(engine);
  fc.assert(
    fc.property(
      fc.constantFrom(
        "fade" as const,
        "rise" as const,
        "slide" as const,
        "zoom" as const,
      ),
      fc.constantFrom(
        "linear" as const,
        "easeOut" as const,
        "easeInOut" as const,
      ),
      fc.integer({ min: 1, max: 10000 }),
      fc.integer({ min: 0, max: 60000 }),
      fc.integer({ min: 0, max: 7 }),
      fc.integer({ min: -180, max: 180 }),
      (effect, easing, durationMs, delayMs, step, rotation) => {
        unwrap(
          deck.apply([
            {
              type: "setFrame",
              nodeId: "title",
              frame: { x: 40, y: 40, width: 500, height: 100, rotation },
            },
            {
              type: "setAnimation",
              nodeId: "title",
              animation: { effect, durationMs, delayMs, easing },
            },
            { type: "setStep", nodeId: "title", step },
            { type: "setStep", nodeId: "left", step },
            {
              type: "setAnimation",
              nodeId: "shape",
              animation: { effect, durationMs, delayMs, easing },
            },
            { type: "setStep", nodeId: "shape", step },
          ]),
        );
        const scene = unwrap(deck.compile()).scene;
        const output = unwrap(engine.writePptx(scene));
        expect(
          output.diagnostics
            .filter((d) => d.code !== "emptyAnimationStep")
            .map((d) => d.code),
        ).toEqual(
          easing === "linear"
            ? []
            : ["animationEasingApproximation", "animationEasingApproximation"],
        );
        const imported = unwrap(engine.parsePptx(output.bytes));
        expect(
          imported.diagnostics.some((d) => d.code === "unsupportedAnimation"),
        ).toBe(false);
        expect(imported.scene.slides[0]?.elements[0]).toMatchObject({
          step,
          animation: { effect, durationMs, delayMs, easing },
          frame: scene.slides[0]?.elements[0]?.frame,
        });
        // A step without an entrance is a native appear build; step zero stays ordinary visible content.
        expect(imported.scene.slides[0]?.elements[1]?.step ?? 0).toBe(step);
        expect(imported.scene.slides[1]?.elements[0]).toMatchObject({
          step,
          animation: { effect, durationMs, delayMs, easing },
        });
      },
    ),
    { numRuns: 40 },
  );
});

it("reports native timing quantization and rejects excessive reveal steps before export", () => {
  const engine = testEngine();
  const deck = testDeck(engine);
  unwrap(
    deck.apply([
      {
        type: "setAnimation",
        nodeId: "title",
        animation: {
          effect: "fade",
          durationMs: 0,
          delayMs: 1.4,
          easing: "linear",
        },
      },
    ]),
  );
  const output = unwrap(engine.writePptx(unwrap(deck.compile()).scene));
  expect(output.diagnostics).toContainEqual(
    expect.objectContaining({
      code: "animationTimingQuantized",
      nodeId: "title",
    }),
  );
  expect(
    unwrap(engine.parsePptx(output.bytes)).scene.slides[0]?.elements[0]
      ?.animation,
  ).toMatchObject({ durationMs: 1, delayMs: 1 });
  const revision = deck.getState().revision;
  expect(
    deck.apply([{ type: "setStep", nodeId: "title", step: 10001 }]).ok,
  ).toBe(false);
  expect(deck.getState().revision).toBe(revision);
});
